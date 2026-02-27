let map;
let markers = {};

// 1. SPECTRUM VISUAL LOGIC
function getSpectrumHtml(freqRanges) {
    const min = 300;
    const max = 5000;
    const total = max - min;

    const bars = freqRanges
        .map((range) => {
            const start = Math.max(0, ((range[0] - min) / total) * 100);
            const width = Math.min(100 - start, ((range[1] - range[0]) / total) * 100);
            return `<div class="spectrum-bar" style="left: ${start}%; width: ${width}%;"></div>`;
        })
        .join("");

    return `
        <div class="spectrum-wrapper">
            <div class="spectrum-track">${bars}</div>
            <div class="scale-label"><span>300M</span><span>2.6G</span><span>5G</span></div>
        </div>
    `;
}

// 2. CSV HELPERS
function normalizeHeader(header) {
    return header
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[()]/g, "")
        .replace(/__+/g, "_");
}

function parseCsv(text) {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    // Parse a CSV line with basic quote handling
    function parseLine(line) {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                // Toggle quote state, but handle escaped quotes ("")
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === "," && !inQuotes) {
                result.push(current);
                current = "";
            } else {
                current += char;
            }
        }
        result.push(current);
        return result.map((c) => c.trim());
    }

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map(normalizeHeader);
    const rows = lines.slice(1);

    return rows.map((line) => {
        const cells = parseLine(line);
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = cells[idx] ?? "";
        });
        return obj;
    });
}

function parseCoords(coordField) {
    if (!coordField) return [];
    const parts = coordField
        .split(";")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    function dmsToDecimal(text) {
        const match = text.match(/(\d+)-(\d+)-(\d+)/);
        if (!match) return NaN;
        const deg = parseFloat(match[1]);
        const min = parseFloat(match[2]);
        const sec = parseFloat(match[3]);
        return deg + min / 60 + sec / 3600;
    }

    const coords = [];
    for (let i = 0; i < parts.length - 1; i += 2) {
        const latText = parts[i];
        const lngText = parts[i + 1];
        let lat = dmsToDecimal(latText);
        let lng = dmsToDecimal(lngText);

        // Treat WL (west longitude) as negative
        if (/WL/i.test(lngText)) {
            lng = -lng;
        }

        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            coords.push([lat, lng]);
        }
    }

    return coords;
}

function parseFreqRanges(freqField) {
    if (!freqField) return [];
    return freqField.split(",").map((range) => {
        const cleaned = range.replace(/MHz/gi, "").trim();
        const [startStr, endStr] = cleaned.split("-").map((s) => s.trim());
        return [parseFloat(startStr), parseFloat(endStr)];
    });
}

function buildFreqLabel(ranges) {
    if (ranges.length === 0) return "";
    if (ranges.length === 1) {
        const [start, end] = ranges[0];
        return `${start} - ${end}`;
    }
    const firstStart = ranges[0][0];
    const lastEnd = ranges[ranges.length - 1][1];
    return `${firstStart} - ${lastEnd} (Multiple)`;
}

// 3. POPULATE UI FROM DATA
function renderLicenses(licenseData) {
    const tableBody = document.querySelector("#licenseTable tbody");
    tableBody.innerHTML = "";
    markers = {};

    licenseData.forEach((license) => {
        const row = document.createElement("tr");
        row.id = `row-${license.callsign}`;
        row.innerHTML = `
            <td class="callsign">${license.callsign}</td>
            <td>${license.eff}<br><span style="color:#e53e3e; font-size:10px;">Exp: ${license.exp}</span></td>
            <td>${license.emissions}</td>
            <td>${license.power}</td>
            <td style="font-size: 10px;">${license.location}</td>
            <td class="freq-numbers">${license.freqLabel}</td>
            <td>${getSpectrumHtml(license.freqs)}</td>
        `;

        row.onclick = () => highlightLicense(license.callsign, true);
        tableBody.appendChild(row);

        license.coords.forEach((coord) => {
            const marker = L.circleMarker(coord, {
                color: "#2c3e50",
                weight: 1,
                fillColor: "#e74c3c",
                fillOpacity: 0.9,
                radius: 7
            }).addTo(map);

            marker.bindTooltip(license.callsign, { className: "tooltip-custom" });

            marker.on("click", (e) => {
                L.DomEvent.stopPropagation(e);
                highlightLicense(license.callsign, false);
                document.getElementById(`row-${license.callsign}`).scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });

            if (!markers[license.callsign]) markers[license.callsign] = [];
            markers[license.callsign].push(marker);
        });
    });
}

// 4. HIGHLIGHT & SYNC
function highlightLicense(callsign, moveMap) {
    document.querySelectorAll("tr").forEach((r) => r.classList.remove("active-row"));
    Object.values(markers)
        .flat()
        .forEach((m) => m.setStyle({ fillColor: "#e74c3c", radius: 7 }));

    const row = document.getElementById(`row-${callsign}`);
    row.classList.add("active-row");

    const activeMarkers = markers[callsign] || [];
    activeMarkers.forEach((m) => m.setStyle({ fillColor: "#3498db", radius: 10 }));

    if (moveMap && activeMarkers.length > 0) {
        const group = new L.featureGroup(activeMarkers);
        map.fitBounds(group.getBounds(), { padding: [100, 100], maxZoom: 8 });
    }
}

// 5. INITIALIZE MAP AND LOAD CSV
window.addEventListener("DOMContentLoaded", async () => {
    map = L.map("map").setView([38.5, -110], 4);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "©OpenStreetMap"
    }).addTo(map);

    try {
        const response = await fetch("licenses.csv");
        if (!response.ok) {
            console.error("Failed to load licenses.csv", response.status, response.statusText);
            return;
        }
        const text = await response.text();
        const rawRows = parseCsv(text);

        const licenseData = rawRows.map((row) => {
            const coords = parseCoords(row.station_coordinates);
            const freqs = parseFreqRanges(row.frequency);
            return {
                callsign: row.callsign,
                eff: row.authorization_effective_date,
                exp: row.authorization_expiry_date,
                emissions: row.emission_designators,
                power: row.authorized_power,
                location: row.station_location,
                coords,
                freqs,
                freqLabel: buildFreqLabel(freqs)
            };
        });

        licenseData.sort((a, b) => a.callsign.localeCompare(b.callsign));
        renderLicenses(licenseData);
    } catch (err) {
        console.error("Error loading licenses.csv", err);
    }
});

