import MAPS from "../../maps.json" with {type: "json"};

function randomId() {
  return Math.random().toString(36).substring(2, 8);
};

function generateCalloutHtml(c) {
    const id = randomId();
    return {
        callout: `
            <div class="callout" data-c-id="${id}">
                <span class="marker" style="left: ${c.marker.x}%; top: ${c.marker.y}%;">${c.marker.text}</span>
                <div class="card" style="left: ${c.card.x}%; top: ${c.card.y}%;">
                    <div class="card-header">
                        <span class="title">${c.title}</span>
                        <span class="callout-edit-btns"><i class="nf nf-oct-duplicate" title="Duplicate callout"></i></span>
                    </div>
                    <div class="card-img">
                        <i class="nf nf-md-arrow_expand_all" data-img="${c.img}"></i>
                        <img src="${c.img}" alt="Linup image" draggable="false">
                        ${c.altImg ? `<img src="${c.altImg}" alt="Alternative linup image" draggable="false" class="alt-img hidden">` : ""}
                    </div>
                    <div class="card-footer">
                        <span class="throw-type">${c.type}</span>
                        <span class="copy-linup-cmd" title="${c.lineupCmd}">Lineup <i class="nf nf-md-content_copy"></i></span>
                    </div>
                </div>
            </div>`,
        line: `<line data-c-id="${id}" x1="${c.marker.x}%" y1="${c.marker.y}%" x2="${c.card.x}%" y2="${c.card.y}%" stroke-width="8px" stroke="currentColor"/>`
    }
}

function addCardEventListeners() {
    document.querySelectorAll(".card-img .nf-md-arrow_expand_all").forEach(e => {
        const img = e.getAttribute("data-img");
        e.addEventListener("click", () => fullScreenImage(img));
    });

    document.querySelectorAll(".card-img:has(.alt-img)").forEach(e => {
        e.addEventListener("mouseover", () => {
            e.querySelector(".alt-img").classList.remove("hidden");
            e.querySelector("img:not(.alt-img)").classList.add("hidden");
        });
        e.addEventListener("mouseout", () => {
            e.querySelector(".alt-img").classList.add("hidden");
            e.querySelector("img:not(.alt-img)").classList.remove("hidden");
        });
    });

    document.querySelectorAll(".copy-linup-cmd").forEach(e => {
        const cmd = e.getAttribute("title");
        e.addEventListener("click", () => {
            navigator.clipboard.writeText(cmd);
            const i = e.querySelector("i");
            i.classList.remove("nf-md-content_copy");
            i.classList.add("nf-cod-check");
            setTimeout(() => {
                i.classList.add("nf-md-content_copy");
                i.classList.remove("nf-cod-check");
            }, 500);
        });
    });

    document.querySelectorAll(".callout-edit-btns .nf-oct-duplicate").forEach(e => {
        const id = e.closest(".callout").getAttribute("data-c-id");
        e.addEventListener("click", e => duplicateCallout(id));
    });
}

function renderMap(mapJson) {
    const callouts = mapJson.callouts.map(c => generateCalloutHtml(c));

    document.querySelector("#map").innerHTML = `
        <img src="${mapJson.mapImage}" alt="Map image" draggable="false">
        <h1>${mapJson.mapName}: ${mapJson.title}</h1>
        <svg class="lines">
            ${callouts.map(c => c.line).join("")}
        </svg>
        ${callouts.map(c => c.callout).join("")}`;

    // set image aspect ratio
    const img = document.querySelector('#map > img');
    img.addEventListener("load", () => {
        img.style.setProperty('--aspect-ratio', img.naturalWidth / img.naturalHeight);
    });
    
    addCardEventListeners();
}

const controls = {
    normal: [
        {
            icon: "nf-md-map_search",
            text: "Select <u>M</u>ap",
            f: openSelectMapMenu
        },
        {
            icon: "nf-cod-zoom_in",
            text: "Toggle <u>Z</u>oom",
            f: toggleZoom
        },
        {
            icon: "nf-oct-pencil",
            text: "<u>E</u>dit",
            f: toggleEdit
        }
    ],
    edit: [
        {
            icon: "nf-md-pencil_off",
            text: "Exit <u>E</u>dit",
            f: toggleEdit
        },
        {
            icon: "nf-fae-file_export",
            text: "E<u>x</u>port",
            f: exportEdit
        },
        {
            icon: "nf-cod-add",
            text: "<u>A</u>dd",
            f: openAddCalloutMenu
        }
    ]
}

function renderControls(mode="normal") {
    const cElem = document.querySelector("#controls")
    cElem.setAttribute("data-mode", mode);
    cElem.innerHTML = "";

    controls[mode].forEach(c => {
        const control = document.createElement("div");
        control.className = "control";
        control.innerHTML = `<i class="nf ${c.icon}"></i><span class="text">${c.text}</span>`;
        control.addEventListener("click", c.f);
        cElem.appendChild(control);
    });
}

function getMode() {
    return document.querySelector("#controls").getAttribute("data-mode");
}

function toggleZoom() {
    document.querySelector("#map").classList.toggle("zoom-enabled");
}

function startDrag(mousedownEv) {
    const dragElem = mousedownEv.currentTarget;
    function onDrag(e) {
        const rect = document.querySelector("#map").getBoundingClientRect();

        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        
        dragElem.style.left = x + '%';
        dragElem.style.top = y + '%';
        
        const id = dragElem.parentElement.getAttribute("data-c-id");
        const line = document.querySelector(`line[data-c-id="${id}"]`);
        const marker = dragElem.parentElement.querySelector(".marker");
        const card = dragElem.parentElement.querySelector(".card");
        line.setAttribute('x1', marker.style.left);
        line.setAttribute('y1', marker.style.top);
        line.setAttribute('x2', card.style.left);
        line.setAttribute('y2', card.style.top);
    }

    function stopDrag() {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}



function enterEditMode() {
    document.querySelectorAll(".callout .marker").forEach(el => el.addEventListener("mousedown", startDrag));
    document.querySelectorAll(".callout .card").forEach(el => el.addEventListener("mousedown", startDrag));
}

function exitEditMode() {
    document.querySelectorAll(".callout .marker").forEach(el => el.removeEventListener("mousedown", startDrag));
    document.querySelectorAll(".callout .card").forEach(el => el.removeEventListener("mousedown", startDrag));
}

function toggleEdit() {
    if(getMode() === "normal") {
        enterEditMode();
        renderControls("edit");
    } else {
        exitEditMode();
        renderControls("normal");
    }
}

function exportCallout(c) {
    const line = map.querySelector(`line[data-c-id="${c.getAttribute("data-c-id")}"]`);
    return {
        title: c.querySelector(".title").innerText,
        type: c.querySelector(".throw-type").innerText,
        lineupCmd: c.querySelector(".copy-linup-cmd").getAttribute("title"),
        img: c.querySelector("img").getAttribute("src"),
        marker: {
            text: c.querySelector(".marker").innerText,
            x: parseFloat(line.getAttribute("x1")),
            y: parseFloat(line.getAttribute("y1"))
        },
        card: {
            x: parseFloat(line.getAttribute("x2")),
            y: parseFloat(line.getAttribute("y2"))
        }
    }
}

function exportEdit() {
    const map = document.querySelector("#map");
    const t = map.querySelector("h1").innerText.split(": ");
    const json = {
        mapName: t[0],
        title: t.slice(1).join(": "),
        mapImage: map.querySelector("img").getAttribute("src"),
        callouts: [...map.querySelectorAll(".callout")].map(c => exportCallout(c))
    };

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 4));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "download.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function addCallout(e) {
    e.preventDefault();
    const html = generateCalloutHtml({
        title: document.querySelector("#add-callout-title").value,
        type: document.querySelector("#add-callout-type").value,
        lineupCmd: document.querySelector("#add-callout-lineup-cmd").value,
        img: document.querySelector("#add-callout-img").value,
        altImg: document.querySelector("#add-alt-callout-img").value,
        marker: {
            "text": document.querySelector("#add-callout-marker-text").value,
            "x": 40,
            "y": 50
        },
        card: {
            "x": 60,
            "y": 50
        }
    });

    document.querySelector("#map").innerHTML += html.callout;
    document.querySelector("#map svg").innerHTML += html.line;

    closeAllModals();
    enterEditMode();
    addCardEventListeners();
}

function duplicateCallout(id) {
    const newId = randomId();
    const newC = document.querySelector(`.callout[data-c-id="${id}"]`).cloneNode(true);
    newC.setAttribute("data-c-id", newId);
    document.querySelector("#map").appendChild(newC);
    
    const newL = document.querySelector(`line[data-c-id="${id}"]`).cloneNode(true);
    newL.setAttribute("data-c-id", newId);
    document.querySelector("#map svg").appendChild(newL);
    
    enterEditMode();
    addCardEventListeners();
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(e => e.classList.add("hidden"));
}

function openAddCalloutMenu() {
    const el = document.querySelector("#add-callout");
    el.querySelector("i").addEventListener("click", closeAllModals);
    el.classList.remove("hidden");
    el.querySelector("form input").focus();
    el.querySelector("button").addEventListener("click", addCallout);
}

function fullScreenImage(img) {
    const el = document.querySelector("#fullscreen-img");
    el.querySelector("img").src = img;
    el.querySelector("i").addEventListener("click", closeAllModals);
    el.classList.remove("hidden");
}

function isSelectMenuOpen() {
    return !document.querySelector("#map-selector").classList.contains("hidden");
}

function mapSelectNextMapInList(prev=false) {
    const el = document.querySelector("#map-selector .selected");
    const newEl = prev ? el.nextElementSibling : el.previousElementSibling;

    if(newEl) {
        newEl.classList.add("selected");
        newEl.scrollIntoView({block: "center"});
        el.classList.remove("selected");
    }
}

function imageExists(url) {
  return new Promise(resolve => {
    var img = new Image()
    img.addEventListener('load', () => resolve(true))
    img.addEventListener('error', () => resolve(false))
    img.src = url
  })
}

function renderSelectMapList(q="") {
    const list = document.querySelector("#map-selector ul");
    list.innerHTML = ``;
    const filteredMaps = MAPS.filter(m => `${m.mapName}: ${m.title}`.toLowerCase().includes(q));

    for(const i in filteredMaps) {
        const m = filteredMaps[i];
        const li = document.createElement("li");
        if(i == 0) li.className = "selected";
        li.innerHTML = `<b>${m.mapName}:</b> ${m.title}`;
        li.addEventListener("click", () => {
            renderMap(m);
            closeAllModals();
        });

        const mapIconUrl = `/assets/img/map_icons/${m.mapName.replace(" ", "").toLowerCase()}.png`;
        imageExists(mapIconUrl).then(exists => {
            if(exists) li.style.setProperty("--map-icon", `url("${mapIconUrl}")`);
        });
        
        list.appendChild(li);
    }
}

function openSelectMapMenu() {
    const el = document.querySelector("#map-selector");
    const input = el.querySelector("input");

    el.querySelector("i").addEventListener("click", closeAllModals);
    input.addEventListener("input", () => renderSelectMapList(input.value));

    el.classList.remove("hidden");
    input.focus();
    // animation frame is used to allow the browser to process that input is visible
    requestAnimationFrame(() => input.select());
    renderSelectMapList(input.value);
}

function main() {
    renderMap(MAPS[0]);
    renderControls();
    openSelectMapMenu();

    document.addEventListener("keydown", e => {
        // console.log(e.key);

        if(e.key == "Escape") closeAllModals();

        if(isSelectMenuOpen()) {
            switch(e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    mapSelectNextMapInList(true);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    mapSelectNextMapInList();
                    break;
                case "Enter":
                    const m = document.querySelector("#map-selector .selected");
                    if(m) {
                        m.click();
                    }
                    break;
                default:
                    document.querySelector("#map-selector input").focus()
            }
        }

        // ignore events when input element is active
        if(document.activeElement && document.activeElement.tagName === 'INPUT') return;

        switch(e.key) {
            case "m":
            case "M":
                e.preventDefault();
                openSelectMapMenu();
                break;
            case "z":
            case "Z":
                toggleZoom();
                break;
            case "e":
            case "E":
                toggleEdit();
                break;
        }

        if(getMode() === "edit") {
            switch(e.key) {
                case "x":
                case "X":
                    exportEdit();
                    break;
                case "a":
                case "A":
                    openAddCalloutMenu();
                    break;
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", main);