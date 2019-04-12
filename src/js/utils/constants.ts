export const enum IdentifierKind {
    DOI = 'doi',
    PMID = 'pmid',
    PMCID = 'pmcid',
}

export const CSL_DATE_KEYS: ReadonlyArray<CSL.DateFieldKey> = [
    'accessed',
    'container',
    'event-date',
    'issued',
    'original-date',
    'submitted',
];

export const CSL_NUMBER_KEYS: ReadonlyArray<CSL.NumberFieldKey> = [
    'chapter-number',
    'collection-number',
    'edition',
    'issue',
    'number',
    'number-of-pages',
    'number-of-volumes',
    'volume',
];

export const CSL_PERSON_KEYS: ReadonlyArray<CSL.PersonFieldKey> = [
    'author',
    'collection-editor',
    'composer',
    'container-author',
    'director',
    'editor',
    'editorial-director',
    'illustrator',
    'interviewer',
    'original-author',
    'recipient',
    'reviewed-author',
    'translator',
];

export const CSL_STRING_KEYS: ReadonlyArray<CSL.StringFieldKey> = [
    'abstract',
    'annote',
    'archive',
    'archive_location',
    'archive-place',
    'authority',
    'call-number',
    'citation-label',
    'citation-number',
    'collection-title',
    'container-title',
    'container-title-short',
    'dimensions',
    'DOI',
    'event',
    'event-place',
    'first-reference-note-number',
    'genre',
    'ISBN',
    'ISSN',
    'journalAbbreviation',
    'jurisdiction',
    'keyword',
    'language',
    'locator',
    'medium',
    'note',
    'original-publisher',
    'original-publisher-place',
    'original-title',
    'page',
    'page-first',
    'PMID',
    'PMCID',
    'publisher',
    'publisher-place',
    'references',
    'reviewed-title',
    'scale',
    'section',
    'shortTitle',
    'source',
    'status',
    'title',
    'title-short',
    'URL',
    'version',
    'year-suffix',
];

export const CSL_KEYS: ReadonlyArray<keyof CSL.Data> = [
    'id',
    'type',
    ...CSL_DATE_KEYS,
    ...CSL_NUMBER_KEYS,
    ...CSL_PERSON_KEYS,
    ...CSL_STRING_KEYS,
];

export const ZERO_WIDTH_SPACE = '\u200b';

// vim: set fdm=indent fdl=0:
