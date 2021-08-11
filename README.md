# mtg-rule-site
This is a single page react app for reading the rules of the game: magic the gathering.
The rules are fetched from a text file at wizards of the coast official website, parsed and presented as a simple website.

The rules are loaded through a free CORS-proxy since free hosts block outgoing connections to the wizards domain.
It may take a while to load the page for the first time, but after that, it should work without delay.

A filter text field can be used to filter only the rules containing the text in the filter text field.
The filter text is not refreshed when a new chapter is opened.

Links to other chapters are automatically added to every instance of 3 digit number in a rule.
None of the hyperlinks on the page actually change the page, so moving to the previously selected chapter is not possible at the moment.

The css is very minimal. Enough to make the site usable, at least in some cases, but not very pretty.

This was my first time using react and I really liked it, I think it was very easy to get the hang of.
