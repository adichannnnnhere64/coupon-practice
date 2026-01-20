{
  description = "Tauri v2 app with Android support on NixOS";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android.url = "github:tadfisher/android-nixpkgs";
    # Optional: pin a specific SDK/NDK version
    # android.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, android }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        androidEnv = android.sdk.${system} (sdk: with sdk; [
          cmdline-tools-latest
          build-tools-34-0-0
          platform-tools
          platforms-android-34
          ndk-26-1-10909125   # Tauri v2 requires ndk >= 25, 26 is safe
          cmake-3-22-1
        ]);
      in
      {
        devShells.default = pkgs.mkShell {
          ANDROID_SDK_ROOT = "${androidEnv}/share/android-sdk";
          ANDROID_NDK_ROOT = "${androidEnv}/share/android-sdk/ndk/26.1.10909125";
          PATH = "${androidEnv}/bin:${pkgs.jdk17}/bin:$PATH";

          shellHook = ''
            echo "Tauri Android shell ready"
            echo "SDK: $ANDROID_SDK_ROOT"
            echo "NDK: $ANDROID_NDK_ROOT"
          '';

          nativeBuildInputs = with pkgs; [
            pkg-config
            openssl
            androidEnv
            jdk17
            rustup
            cargo-tauri
            nodejs
            pnpm_9   # or yarn/npm if you prefer
          ];

          buildInputs = with pkgs; [
            webkitgtk
            gtk3
            libsoup
            glib-networking
            librsvg
          ];
        };
      });
}
