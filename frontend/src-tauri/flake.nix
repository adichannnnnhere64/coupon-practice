{
  description = "Tauri v2 app with Android support on NixOS";

  inputs = {
    # nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";  # Try this instead
    flake-utils.url = "github:numtide/flake-utils";
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    android.url = "github:tadfisher/android-nixpkgs/stable";
  };

  outputs = { self, nixpkgs, flake-utils, fenix, android }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Fenix Rust toolchain with Android targets
        rust-toolchain = fenix.packages.${system}.combine [
          fenix.packages.${system}.targets.aarch64-linux-android.latest.rust-std
          fenix.packages.${system}.targets.armv7-linux-androideabi.latest.rust-std
          fenix.packages.${system}.targets.x86_64-linux-android.latest.rust-std
          fenix.packages.${system}.targets.i686-linux-android.latest.rust-std
          fenix.packages.${system}.complete.toolchain
        ];

        # Android SDK with NDK and all required build tools including platform 36
        androidEnv = android.sdk.${system} (sdkPkgs: with sdkPkgs; [
          cmdline-tools-latest
          build-tools-34-0-0
          build-tools-35-0-0
          platform-tools
          platforms-android-34
          platforms-android-35
          platforms-android-36  # Add the required platform
          cmake-3-22-1
          ndk-26-1-10909125
        ]);

        # Create a writable Android SDK directory
        androidSdkWritable = pkgs.runCommand "android-sdk-writable" {
          nativeBuildInputs = [ pkgs.rsync ];
        } ''
          mkdir -p $out
          rsync -a ${androidEnv}/share/android-sdk/ $out/
          chmod -R +w $out
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            rust-toolchain
            cargo-tauri
            cargo-ndk
            nodejs
            pnpm_9
            pkg-config
            openssl
            jdk17
            gradle
            android-tools
            # Desktop Tauri deps
            webkitgtk_4_1
            gtk3
            libsoup_3
            glib-networking
            librsvg
            cairo
            gdk-pixbuf
          ];

          # Use writable SDK directory
          ANDROID_SDK_ROOT = "${androidSdkWritable}";
          ANDROID_NDK_ROOT = "${androidSdkWritable}/ndk/26.1.10909125";
          JAVA_HOME = "${pkgs.jdk17}";
          GRADLE_USER_HOME = "$HOME/.gradle";

          # Important: Set ANDROID_HOME separately for Gradle
          ANDROID_HOME = "${androidSdkWritable}";

          # Fixed PATH
          PATH = with pkgs; lib.strings.makeBinPath [
            jdk17
            gradle
            android-tools
          ] + ":${androidSdkWritable}/cmdline-tools/latest/bin:${androidSdkWritable}/platform-tools";

          # Runtime libs
          LD_LIBRARY_PATH = with pkgs; lib.strings.makeLibraryPath [
            stdenv.cc.cc.lib
            glibc

                        gtk3
  webkitgtk_4_1
  libsoup_3
  glib
  gdk-pixbuf
  cairo
  librsvg
  pango
  atk
  harfbuzz

  # Additional ones that sometimes bite on NixOS
  openssl
  libappindicator-gtk3   # for system tray (if you ever use it)
  libayatana-appindicator # newer alternative, safe to include
          ];

          shellHook = ''
            echo "Tauri Android shell ready!"
            echo "SDK: $ANDROID_SDK_ROOT (writable)"
            echo "NDK: $ANDROID_NDK_ROOT"
            echo "Gradle: $(gradle --version 2>/dev/null | head -1 || echo 'checking...')"

            # Verify NDK
            if [ -d "$ANDROID_NDK_ROOT" ]; then
              echo "NDK verified: $(cat $ANDROID_NDK_ROOT/source.properties | head -1)"
            else
              echo "NDK not found at expected location"
            fi

            # Show installed Rust targets
            echo "Rust targets available:"
            rustc --print target-list | grep android || echo "No Android targets found"

            # Show available SDK components
            echo "Available SDK components:"
            ls -la $ANDROID_SDK_ROOT/build-tools/ 2>/dev/null || echo "No build-tools found"
            ls -la $ANDROID_SDK_ROOT/platforms/ 2>/dev/null || echo "No platforms found"

            # Create local.properties in your Tauri project if it doesn't exist
            if [ -f "$PWD/src-tauri/gen/android/local.properties" ]; then
              echo "local.properties already exists"
            else
              echo "Creating local.properties file..."
              cat > "$PWD/src-tauri/gen/android/local.properties" << EOF
            sdk.dir=$ANDROID_SDK_ROOT
            ndk.dir=$ANDROID_NDK_ROOT
            EOF
            fi

            # Set Gradle properties to prevent auto-download
            mkdir -p ~/.gradle
            cat > ~/.gradle/gradle.properties << EOF
            android.builder.sdkDownload=false
            org.gradle.parallel=true
            android.overridePathCheck=true
            EOF
          '';
        };
      });
}
