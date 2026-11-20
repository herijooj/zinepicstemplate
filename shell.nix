# Everything needed to build the zine. Enter with `nix-shell` or `direnv allow`.
{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  packages = with pkgs; [
    texliveSmall    # xelatex, tikz, fontspec, pdfpages for the zine
    poppler-utils   # pdftoppm / pdfinfo, for previewing and checking pages
    exiftool        # pool scan (photo dimensions) for layout.sh sync
    python3         # photo picker WebUI (./layout.sh picker)
  ];

  shellHook = ''
    echo "zine: xelatex + tikz ready -- run './build.sh' (or 'make')"
  '';
}
