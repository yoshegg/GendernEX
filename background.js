let genderPairs
let parser = new cssjs();

getGenderedDatabase().then(csv => {
    genderPairs = csv
    walk(document.body);
})

setTimeout(function () {
    getGenderedDatabase().then(csv => {
        genderPairs = csv
        walk(document.body);
    })
}, 1000);

/**
 * Gets the gendered database by reading the .csv file.
 *
 * @returns {Promise<Object>} contains the word pairs from data.csv
 */
async function getGenderedDatabase() {
    let csvData = await $.get(chrome.runtime.getURL('data.csv'))
    return $.csv.toObjects(csvData)
}

/**
 * Walks through a given DOM element.
 * Source: http://is.gd/mwZp7E
 *
 * @param node A DOM element
 */
function walk(node) {

    var child, next;

    switch (node.nodeType) {
        case 1:  // Element
        case 9:  // Document
        case 11: // Document fragment
            child = node.firstChild;
            while (child) {
                next = child.nextSibling;
                walk(child);
                child = next;
            }
            break;

        case 3: // Text node
            handleText(node);
            break;
    }
}

/**
 * Handles the text of a given node by replacing all gendered words.
 *
 * @param {String} textNode A DOM element containing text
 */
function handleText(textNode) {
    var v = textNode.nodeValue;

    if (!v.startsWith('(function') &&
        !v.startsWith('https://') &&
        !v.startsWith('http://') &&
        // a dirty hack because google search results pages contain *used* CSS
        // as text nodes
        parser.parseCSS(v).length === 0
    ) {
        genderPairs.forEach(entry => {
            v = replaceFromDatabase(v, entry)
        })
        v = replaceDefaults(v)
    }
    textNode.nodeValue = v;
}

/**
 * Replaces words from the given .csv database
 *
 * @param text A String
 * @param entry An entry from the database
 * @returns {text} A possibly de-gendered String
 */
function replaceFromDatabase(text, entry) {
    // Creates a Regex for multiple different gender possibilities
    let generalized = entry['gegendert'].replace(':', '\[:*_\]')

    // Replaces complete words
    text = text.replace(
        RegExp(`${generalized}`, 'g'),
        entry['generisch']
    )

    return text
}

/**
 * Replaces generic gendered suffixes.
 *
 * @param {String} text A String
 * @returns {String} The de-gendered String
 */
function replaceDefaults(text) {
    // Replaces :innen, *innen and _innen.
    text = text.replace(/[:*_]innen/g, '')

    // Replaces :in, *in and _in
    text = text.replace(/[:*_]in/g, '')

    // Replaces -Innen
    text = text.replace(/([A-z]+)Innen\b/g, '$1')

    // Replaces -In
    text = text.replace(/([A-z]+)In\b/g, '$1')

    // Replaces Nominativ
    text = text.replace(/([A-z]+)[:*_]e/g, '$1')

    // // Replaces Akkusativ
    text = text.replace(/([A-z]+)e[:*_]n/g, '$1en')

    return text
}

