console.log("Formulario de imágenes conectado.");

const trackItems = [
    "MID",
    "Canopy",
    "Concreto de Pista",
    "Dispensadoras",
    "Área de Tanques",
    "Baño de Pista",
    "Cuarto Eléctrico",
    "Veeder Root / Fusión"
];

const storeItems = [
    "Imagen General",
    "Aires Acondicionados",
    "Counter",
    "Baños de Tienda",
    "Cocina",
    "Oficina"
];

const photos = {
    track: {},
    store: {}
};

trackItems.forEach(function (item) {
    photos.track[item] = [];
});

storeItems.forEach(function (item) {
    photos.store[item] = [];
});

const inspectionForm = document.getElementById("inspectionForm");
const trackEquipment = document.getElementById("trackEquipment");
const storeEquipment = document.getElementById("storeEquipment");
const storeSection = document.getElementById("storeSection");
const errorMessage = document.getElementById("errorMessage");
const formView = document.getElementById("formView");
const reportView = document.getElementById("reportView");
const loadingMessage = document.getElementById("loadingMessage");

function createSafeId(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
}

function createEquipmentBlock(item, section) {
    const id = section + "-" + createSafeId(item);

    return `
        <div class="equipment-block">
            <div
                class="equipment-title"
                id="${id}-title"
            >
                ${item}
            </div>

            <div class="equipment-content">
                <p>
                    Toma una foto o selecciona una imagen de tu galería.
                </p>

                <div class="photo-actions">
                    <label
                        for="${id}-camera"
                        class="photo-button camera-button"
                    >
                        📷 Tomar Foto
                    </label>

                    <input
                        hidden
                        type="file"
                        id="${id}-camera"
                        accept="image/*"
                        capture="environment"
                        data-section="${section}"
                        data-item="${item}"
                    >

                    <label
                        for="${id}-gallery"
                        class="photo-button gallery-button"
                    >
                        🖼 Seleccionar de Galería
                    </label>

                    <input
                        hidden
                        type="file"
                        id="${id}-gallery"
                        accept="image/*"
                        multiple
                        data-section="${section}"
                        data-item="${item}"
                    >
                </div>

                <div
                    class="preview-container"
                    id="${id}-previews"
                ></div>

                <p
                    class="photo-count"
                    id="${id}-count"
                >
                    No se han agregado imágenes.
                </p>
            </div>
        </div>
    `;
}

function renderEquipment() {
    trackEquipment.innerHTML = trackItems
        .map(function (item) {
            return createEquipmentBlock(item, "track");
        })
        .join("");

    storeEquipment.innerHTML = storeItems
        .map(function (item) {
            return createEquipmentBlock(item, "store");
        })
        .join("");

    addFileEvents();
}

function addAccordionEvents() {
    document.querySelectorAll(".accordion").forEach(function (button) {
        button.addEventListener("click", function () {
            const panel = button.nextElementSibling;
            const isOpen = panel.classList.toggle("open");

            button.classList.toggle("open", isOpen);
            button.setAttribute("aria-expanded", String(isOpen));
        });
    });
}

function addFileEvents() {
    document
        .querySelectorAll('input[type="file"]')
        .forEach(function (input) {
            input.addEventListener(
                "change",
                handleSelectedImages
            );
        });
}

function handleSelectedImages(event) {
    const input = event.target;
    const section = input.dataset.section;
    const item = input.dataset.item;
    const selectedFiles = Array.from(input.files || []);

    selectedFiles.forEach(function (file) {
        if (!file.type.startsWith("image/")) {
            return;
        }

        compressImage(file, function (compressedImage) {
            photos[section][item].push({
                name: file.name,
                source: compressedImage
            });

            updatePreview(section, item);
        });
    });

    input.value = "";
}

function compressImage(file, callback) {
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        const image = new Image();

        image.addEventListener("load", function () {
            /*
                Todas las fotografías se convierten físicamente
                a un tamaño 4:3 para evitar que el PDF las estire.
            */
            const outputWidth = 1200;
            const outputHeight = 900;

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = outputWidth;
            canvas.height = outputHeight;

            const sourceRatio = image.width / image.height;
            const outputRatio = outputWidth / outputHeight;

            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = image.width;
            let sourceHeight = image.height;

            if (sourceRatio > outputRatio) {
                /*
                    La fotografía es demasiado ancha.
                    Se recortan los lados.
                */
                sourceWidth = image.height * outputRatio;
                sourceX = (image.width - sourceWidth) / 2;
            } else {
                /*
                    La fotografía es demasiado alta.
                    Se recortan la parte superior e inferior.
                */
                sourceHeight = image.width / outputRatio;
                sourceY = (image.height - sourceHeight) / 2;
            }

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, outputWidth, outputHeight);

            context.drawImage(
                image,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                outputWidth,
                outputHeight
            );

            const normalizedImage = canvas.toDataURL(
                "image/jpeg",
                0.82
            );

            callback(normalizedImage);
        });

        image.src = reader.result;
    });

    reader.readAsDataURL(file);
}

function updatePreview(section, item) {
    const id = section + "-" + createSafeId(item);
    const previewContainer = document.getElementById(id + "-previews");
    const countElement = document.getElementById(id + "-count");
    const equipmentTitle = document.getElementById(id + "-title");
    const itemPhotos = photos[section][item];

    previewContainer.innerHTML = itemPhotos
        .map(function (photo, index) {
            return `
                <div class="preview-item">
                    <img
                        src="${photo.source}"
                        alt="Imagen de ${item}"
                    >

                    <button
                        type="button"
                        class="remove-photo"
                        data-section="${section}"
                        data-item="${encodeURIComponent(item)}"
                        data-index="${index}"
                        aria-label="Eliminar imagen"
                    >
                        ×
                    </button>
                </div>
            `;
        })
        .join("");

    previewContainer
        .querySelectorAll(".remove-photo")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                const selectedSection = button.dataset.section;
                const selectedItem = decodeURIComponent(
                    button.dataset.item
                );

                const selectedIndex = Number(button.dataset.index);

                removePhoto(
                    selectedSection,
                    selectedItem,
                    selectedIndex
                );
            });
        });

    if (itemPhotos.length === 0) {
        countElement.textContent = "No se han agregado imágenes.";
        equipmentTitle.classList.remove("complete");
    } else if (itemPhotos.length === 1) {
        countElement.textContent = "1 imagen agregada.";
        equipmentTitle.classList.remove("complete");
    } else {
        countElement.textContent =
            itemPhotos.length + " imágenes agregadas.";

        equipmentTitle.classList.remove("complete");
    }
}

function removePhoto(section, item, index) {
    photos[section][item].splice(index, 1);
    updatePreview(section, item);
}

document
    .querySelectorAll('input[name="has_store"]')
    .forEach(function (radio) {
        radio.addEventListener("change", function () {
            if (radio.value === "yes" && radio.checked) {
                storeSection.classList.remove("hidden");
            }

            if (radio.value === "no" && radio.checked) {
                storeSection.classList.add("hidden");

                storeItems.forEach(function (item) {
                    photos.store[item] = [];
                    updatePreview("store", item);
                });
            }
        });
    });

function getMissingPhotos(items, section) {
    return items.filter(function (item) {
        return photos[section][item].length === 0;
    });
}

function showErrors(errors) {
    errorMessage.innerHTML = `
        <strong>Revisa lo siguiente:</strong>

        <ul>
            ${errors
                .map(function (error) {
                    return `<li>${error}</li>`;
                })
                .join("")}
        </ul>
    `;

    errorMessage.classList.add("visible");

    errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}
function showPhotoWarnings(warnings) {
    errorMessage.innerHTML = `
        <strong>Fotografías pendientes:</strong>

        <ul>
            ${warnings
                .map(function (warning) {
                    return `<li>${warning}</li>`;
                })
                .join("")}
        </ul>

        <p>
            Puedes agregar las fotografías pendientes o volver a
            presionar Entregar para continuar sin ellas.
        </p>
    `;

    errorMessage.classList.add("visible");

    errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function clearErrors() {
    errorMessage.classList.remove("visible");
    errorMessage.innerHTML = "";
}

inspectionForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    const stationName = document
        .getElementById("stationName")
        .value
        .trim();

    const inspectionDate = document
        .getElementById("inspectionDate")
        .value;

    const inspectorName = document
        .getElementById("inspectorName")
        .value
        .trim();

    const storeAnswer = document.querySelector(
        'input[name="has_store"]:checked'
    );

    const requiredErrors = [];
    const missingPhotoWarnings = [];

    /*
        Estos datos sí son obligatorios.
    */
    if (!stationName) {
        requiredErrors.push(
            "Ingresa el nombre de la estación."
        );
    }

    if (!inspectionDate) {
        requiredErrors.push(
            "Selecciona la fecha."
        );
    }

    if (!inspectorName) {
        requiredErrors.push(
            "Ingresa el nombre del inspector."
        );
    }

    if (!storeAnswer) {
        requiredErrors.push(
            "Indica si deseas agregar fotos de tienda."
        );
    }

    /*
        Si faltan datos generales, no se puede entregar.
    */
    if (requiredErrors.length > 0) {
        showErrors(requiredErrors);
        return;
    }

    /*
        Las fotografías faltantes solamente generan
        una advertencia. No bloquean la entrega.
    */
    const missingTrackPhotos = getMissingPhotos(
        trackItems,
        "track"
    );

    if (missingTrackPhotos.length > 0) {
        missingPhotoWarnings.push(
            "Faltan fotos de pista: " +
            missingTrackPhotos.join(", ") +
            "."
        );
    }

    if (storeAnswer.value === "yes") {
        const missingStorePhotos = getMissingPhotos(
            storeItems,
            "store"
        );

        if (missingStorePhotos.length > 0) {
            missingPhotoWarnings.push(
                "Faltan fotos de tienda: " +
                missingStorePhotos.join(", ") +
                "."
            );
        }
    }

    if (missingPhotoWarnings.length > 0) {
        const continueDelivery = window.confirm(
            "ADVERTENCIA\n\n" +
            missingPhotoWarnings.join("\n\n") +
            "\n\n¿Deseas entregar el formulario de todas maneras?"
        );

        if (!continueDelivery) {
            showPhotoWarnings(missingPhotoWarnings);
            return;
        }
    }

    createReport({
        stationName: stationName,
        inspectionDate: inspectionDate,
        inspectorName: inspectorName,
        includeStore: storeAnswer.value === "yes"
    });
});

function formatDate(dateValue) {
    const dateParts = dateValue.split("-");

    if (dateParts.length !== 3) {
        return dateValue;
    }

    return (
        dateParts[2] +
        "/" +
        dateParts[1] +
        "/" +
        dateParts[0]
    );
}

function escapeHtml(value) {
    const temporaryElement = document.createElement("div");
    temporaryElement.textContent = value;
    return temporaryElement.innerHTML;
}

function createReportSection(title, items, section) {
    return `
        <section class="report-section">
            <div class="section-first-page">
                <h2 class="report-section-title">
                    ${title}
                </h2>

                ${createReportEquipment(
                    items[0],
                    section,
                    true
                )}
            </div>

            ${items
                .slice(1)
                .map(function (item) {
                    return createReportEquipment(
                        item,
                        section,
                        false
                    );
                })
                .join("")}
        </section>
    `;
}

function createReportEquipment(item, section, isFirst) {
    const itemPhotos = photos[section][item];

    const imagesHtml = itemPhotos.length > 0
        ? itemPhotos
            .map(function (photo) {
                return `
                    <img
                        src="${photo.source}"
                        alt="Evidencia de ${item}"
                    >
                `;
            })
            .join("")
        : `
            <div class="missing-report-photo">
                No se agregó ninguna fotografía para este equipo.
            </div>
        `;

    return `
        <article
            class="report-equipment ${
                isFirst ? "first-equipment" : "new-pdf-page"
            }"
        >
            <h3>${item}</h3>

            <div class="report-images">
                ${imagesHtml}
            </div>
        </article>
    `;
}

function createReport(data) {
    const reportInformation = document.getElementById(
        "reportInformation"
    );

    const reportContent = document.getElementById(
        "reportContent"
    );

    reportInformation.innerHTML = `
        <div class="report-information">
            <p>
                <strong>Nombre de Estación:</strong>
                ${escapeHtml(data.stationName)}
            </p>

            <p>
                <strong>Fecha:</strong>
                ${formatDate(data.inspectionDate)}
            </p>

            <p>
                <strong>Nombre de Inspector:</strong>
                ${escapeHtml(data.inspectorName)}
            </p>
        </div>
    `;

    let reportHtml = createReportSection(
        "Pista",
        trackItems,
        "track"
    );

    if (data.includeStore) {
        reportHtml += createReportSection(
            "Tienda",
            storeItems,
            "store"
        );
    } else {
        reportHtml += `
            <section class="report-section">
                <h2 class="report-section-title">
                    Tienda
                </h2>

                <p class="no-store-message">
                    No se agregaron fotografías de tienda.
                </p>
            </section>
        `;
    }

    reportContent.innerHTML = reportHtml;

    formView.classList.add("hidden");
    reportView.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document
    .getElementById("backButton")
    .addEventListener("click", function () {
        reportView.classList.add("hidden");
        formView.classList.remove("hidden");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

document
    .getElementById("downloadPdfButton")
    .addEventListener("click", async function () {
        const report = document.getElementById("pdfReport");
        const stationName = document
            .getElementById("stationName")
            .value
            .trim();

        const safeStationName = stationName
            .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, "_");

        loadingMessage.classList.remove("hidden");

        const options = {
            margin: [8, 8, 8, 8],
            filename:
                "Reporte_Imagenes_" +
                safeStationName +
                ".pdf",

            image: {
                type: "jpeg",
                quality: 0.9
            },

            html2canvas: {
                scale: 1.5,
                useCORS: true,
                backgroundColor: "#ffffff",
                scrollY: 0
            },

            jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait"
            },

pagebreak: {
    mode: ["css", "legacy"],
    before: [".new-pdf-page"],
    avoid: [
        ".section-first-page",
        ".report-section-title",
        ".report-equipment h3",
        ".report-images"
    ]
}
        };

        try {
            await html2pdf()
                .set(options)
                .from(report)
                .save();
        } catch (error) {
            console.error("No se pudo generar el PDF:", error);

            alert(
                "No se pudo descargar el PDF. Intenta nuevamente."
            );
        } finally {
            loadingMessage.classList.add("hidden");
        }
    });

function setDefaultDate() {
    const currentDate = new Date();
    const timezoneOffset = currentDate.getTimezoneOffset() * 60000;

    const localDate = new Date(
        currentDate.getTime() - timezoneOffset
    )
        .toISOString()
        .split("T")[0];

    document.getElementById("inspectionDate").value = localDate;
}

renderEquipment();
setDefaultDate();
