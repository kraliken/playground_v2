function stripHeading(line, marker) {
    const s = String(line || "").trim();
    if (!s.startsWith(marker)) return s;
    return s.slice(marker.length).trim();
}


export function parseHeadingHierarchy(rawText, opts = {}) {
    const {
        sectionMarker = "###",
        subMarker = "####",
        includeMarkerLine = true,
    } = opts;

    const text = String(rawText || "");
    const lines = text.split(/\r?\n/);

    const isSection = (line) => line.trim().startsWith(sectionMarker) && !line.trim().startsWith(subMarker);
    const isSub = (line) => line.trim().startsWith(subMarker);

    let cursor = 0; // char index a text-ben
    const sections = [];
    let currentSection = null;
    let currentSub = null;

    const flushSub = () => {
        if (!currentSection || !currentSub) return;
        currentSub.text = currentSub.lines.join("\n").trim();
        currentSub.preview = currentSub.text.slice(0, 240);
        currentSection.subchunks.push(currentSub);
        currentSub = null;
    };

    const flushSection = () => {
        if (!currentSection) return;
        flushSub();
        currentSection.text = currentSection.lines.join("\n").trim();
        currentSection.preview = currentSection.text.slice(0, 240);
        sections.push(currentSection);
        currentSection = null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const start = cursor;
        // CRLF-safe: a split eltüntette a \n-t, de az eredeti text-ben lehet \r\n vagy \n
        // Kiszámoljuk, hogy a sor után van-e \r\n vagy \n
        const nextIndex = start + line.length;
        const hasCRLF = text.slice(nextIndex, nextIndex + 2) === "\r\n";
        const hasLF = text.slice(nextIndex, nextIndex + 1) === "\n";
        const lineBreakLen = hasCRLF ? 2 : (hasLF ? 1 : 0);

        const end = nextIndex + lineBreakLen;
        cursor = end;

        if (isSection(line)) {
            flushSection();
            currentSection = {
                sectionIndex: sections.length,
                sectionTitle: stripHeading(line, sectionMarker),
                lineStart: i,
                lineEnd: i,
                charStart: start,
                charEnd: end,
                lines: [],
                subchunks: [],
                text: "",
                preview: "",
            };
            if (includeMarkerLine) currentSection.lines.push(line);
            continue;
        }

        if (!currentSection) continue;

        if (isSub(line)) {
            flushSub();
            currentSub = {
                subIndex: currentSection.subchunks.length,
                subTitle: stripHeading(line, subMarker),
                lineStart: i,
                lineEnd: i,
                charStart: start,
                charEnd: end,
                lines: [],
                text: "",
                preview: "",
            };
            if (includeMarkerLine) currentSub.lines.push(line);
            currentSection.lineEnd = i;
            currentSection.charEnd = end;
            continue;
        }

        if (currentSub) {
            currentSub.lines.push(line);
            currentSub.lineEnd = i;
            currentSub.charEnd = end;
        } else {
            currentSection.lines.push(line);
        }

        currentSection.lineEnd = i;
        currentSection.charEnd = end;
    }

    flushSection();

    return sections
        .map((s) => ({ ...s, subchunks: (s.subchunks || []).filter((c) => (c.text || "").trim().length > 0) }))
        .filter((s) => (s.text || "").trim().length > 0);
}
