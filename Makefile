PDF = zine_pages.pdf
PREVIEW = preview/page

all: $(PDF)

$(PDF): main.tex zine.sty stickers.tex layout.tsv pool.tsv
	./build.sh

main.tex: layout.tsv pool.tsv
	./gen_main.sh

# PNG of every A7 page, to check the look without leaving the terminal.
preview: $(PDF)
	mkdir -p preview
	rm -f preview/*.png
	pdftoppm -png -r 110 zine_pages.pdf $(PREVIEW)

# Visual picking aid: thumbnails + filenames + current slots.
contact:
	./layout.sh contact

# Local WebUI: drag photos onto page slots (writes layout.tsv).
# Usage: make picker [PORT=8077]
PORT ?= 8077
picker:
	./layout.sh picker $(PORT)

check:
	./layout.sh check

clean:
	rm -f *.aux *.log *.out *.toc
	rm -rf preview

.PHONY: all preview contact check clean
