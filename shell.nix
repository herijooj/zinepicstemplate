# Everything needed to build the zine. Enter with `nix-shell` or `direnv allow`.
{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  packages = with pkgs; [
    texliveSmall    # xelatex, tikz, fontspec, fancyhdr, geometry, pdfpages
    poppler-utils   # pdftoppm / pdfinfo, for previewing and checking pages
  ];

  shellHook = ''
    echo "zine: xelatex + tikz ready -- run 'make' (or 'make preview')"
  '';
}
