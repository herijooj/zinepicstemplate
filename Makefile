TEX = main.tex
PDF = main.pdf
LATEX = xelatex -interaction=nonstopmode -halt-on-error

all: $(PDF)

$(PDF): $(TEX) zine.sty $(wildcard photos/*) $(wildcard fonts/*)
	$(LATEX) $(TEX)
	$(LATEX) $(TEX)

# PNG of every page, to check the look without leaving the terminal.
preview: $(PDF)
	mkdir -p preview
	rm -f preview/*.png
	pdftoppm -png -r 110 $(PDF) preview/page

# Print-ready imposition: 12 A5 pages on A4 landscape, fold and staple.
booklet: $(PDF)
	$(LATEX) booklet.tex

clean:
	rm -f *.aux *.log *.out *.toc
	rm -rf preview

.PHONY: all preview booklet clean
