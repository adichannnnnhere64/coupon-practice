{
  description = "Tauri mobile development (aarch64 only)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    fenix.url = "github:nix-community/fenix";
  };

  outputs = { self, nixpkgs, flake-utils, fenix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { 
          inherit system;
          config = {
            android_sdk.accept_license = true;
            allowUnfree = true;
          };
        };

        # Get the stable toolchain components directly
        stable = fenix.packages.${system}.stable;
        
        # Minimal Rust: stable + aarch64-android target only
        rust-toolchain = fenix.packages.${system}.combine [
          stable.cargo
          stable.rustc
          stable.rust-src
          stable.rustfmt
          fenix.packages.${system}.targets.aarch64-linux-android.stable.rust-std
        ];

        # Android SDK: minimal build
        androidSdk = pkgs.androidenv.composeAndroidPackages {
          cmdLineToolsVersion = "11.0";
          platformVersions = ["34" "36"];
          buildToolsVersions = [ "30.0.3" "34.0.0" "35.0.0"];
          includeNDK = true;
          ndkVersions = ["26.1.10909125"];
          includeSources = false;
          includeSystemImages = false;
          includeEmulator = false;
          
          # Accept all licenses
          extraLicenses = [
            "android-sdk-license"
            "android-sdk-preview-license"
            "android-googletv-license"
            "android-sdk-arm-dbt-license"
            "google-gdk-license"
            "intel-android-extra-license"
            "intel-android-sysimage-license"
            "mips-android-sysimage-license"
          ];
        };

        sdk = androidSdk.androidsdk;
        
      in
      {
        devShells.default = pkgs.mkShell {
          # Set Java
          JAVA_HOME = pkgs.jdk17_headless;
          
          # Android paths
          ANDROID_SDK_ROOT = "${sdk}/libexec/android-sdk";
          ANDROID_NDK_ROOT = "${sdk}/libexec/android-sdk/ndk-bundle";
          
          packages = with pkgs; [
            rust-toolchain
            cargo-tauri
            nodejs
            jdk17_headless  # Essential for Android builds
            gradle
            pkg-config
            openssl
          ];

          shellHook = ''
            echo "Tauri Android (aarch64-only) ready"
            echo "Java: $(java -version 2>&1 | head -1)"
            echo "Android SDK: $ANDROID_SDK_ROOT"
            
            # Check if NDK exists
            if [ -d "$ANDROID_NDK_ROOT" ]; then
              echo "NDK: $ANDROID_NDK_ROOT"
            else
              echo "WARNING: NDK not found at $ANDROID_NDK_ROOT"
              echo "Looking for NDK..."
              find "${sdk}" -name "ndk*" -type d 2>/dev/null | head -5
            fi
            
            # Set ANDROID_HOME for compatibility
            export ANDROID_HOME="$ANDROID_SDK_ROOT"
          '';
        };
      });
}
