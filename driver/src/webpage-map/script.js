const TRACKING_CONFIG = {
    driver: {
        name: "Rahul Verma",
        truckNumber: "KA 01 AB 4271",
        lat: 12.935192,
        lng: 77.624481
    },
    pickup: {
        businessName: "South Hub Warehouse",
        address: "Richmond Road, Bengaluru",
        lat: 12.971599,
        lng: 77.594563
    },
    routeProfile: "driving",
    movementStepMs: 800,
    followZoom: 13
};

const state = {
    map: null,
    driverMarker: null,
    pickupMarker: null,
    maneuverMarker: null,
    routeLine: null,
    routeShadow: null,
    routeData: null,
    simulationTimer: null,
    elapsedSeconds: 0,
    speedMps: 0,
    currentSegmentIndex: 0,
    currentTravelledMeters: 0,
    followDriver: true,
    panelDragPointerId: null,
    panelDragOffsetX: 0,
    panelDragOffsetY: 0,
    panelHasCustomPosition: false,
    suppressFollowBreak: false,
    widgetDragPointerId: null,
    widgetDragOffsetX: 0,
    widgetDragOffsetY: 0,
    widgetHasCustomPosition: false
};

const ui = {
    statusBadge: document.getElementById("statusBadge"),
    progressValue: document.getElementById("progressValue"),
    progressSubline: document.getElementById("progressSubline"),
    progressFill: document.getElementById("progressFill"),
    driverReference: document.getElementById("driverReference"),
    businessReference: document.getElementById("businessReference"),
    distanceValue: document.getElementById("distanceValue"),
    etaValue: document.getElementById("etaValue"),
    arrivalValue: document.getElementById("arrivalValue"),
    panelDistanceValue: document.getElementById("panelDistanceValue") || document.getElementById("distanceValue"),
    panelEtaValue: document.getElementById("panelEtaValue") || document.getElementById("etaValue"),
    panelArrivalValue: document.getElementById("panelArrivalValue") || document.getElementById("arrivalValue"),
    nextInstruction: document.getElementById("nextInstruction"),
    nextInstructionMeta: document.getElementById("nextInstructionMeta"),
    bottomPanel: document.getElementById("bottomPanel"),
    bottomPanelHandle: document.getElementById("bottomPanelHandle"),
    collapseButton: document.getElementById("collapseButton"),
    driverName: document.getElementById("driverName"),
    truckNumber: document.getElementById("truckNumber"),
    businessName: document.getElementById("businessName"),
    businessAddress: document.getElementById("businessAddress"),
    activeRoad: document.getElementById("activeRoad"),
    stepSummary: document.getElementById("stepSummary"),
    upcomingSteps: document.getElementById("upcomingSteps"),
    navHint: document.getElementById("navHint"),
    startNavigationButton: document.getElementById("startNavigationButton"),
    followButton: document.getElementById("followButton"),
    overviewButton: document.getElementById("overviewButton"),
    miniWidget: document.getElementById("miniWidget"),
    miniWidgetHandle: document.getElementById("miniWidgetHandle"),
    expandWidgetButton: document.getElementById("expandWidgetButton"),
    widgetNavigationButton: document.getElementById("widgetNavigationButton"),
    miniStatus: document.getElementById("miniStatus"),
    miniDistanceValue: document.getElementById("miniDistanceValue"),
    miniEtaValue: document.getElementById("miniEtaValue"),
    miniArrivalValue: document.getElementById("miniArrivalValue"),
    miniNextInstruction: document.getElementById("miniNextInstruction")
};

initialize();

async function initialize() {
    bindStaticCopy();
    setupMap();
    setupControls();
    initializePanelDrag();
    initializeWidgetDrag();
    updateFollowButton();
    setWidgetMode(false);

    try {
        setStatus("Fetching route");
        const routeData = await fetchRoute(TRACKING_CONFIG.driver, TRACKING_CONFIG.pickup);
        state.routeData = prepareRoute(routeData);
        state.speedMps = state.routeData.distanceMeters / Math.max(state.routeData.durationSeconds, 1);
        drawRoute(state.routeData);
        addMarkers();
        renderProgress(0);
        startSimulation();
    } catch (error) {
        console.error(error);
        setStatus("Route unavailable");
        updateMetrics(buildMetricPayload("--", "--", "--", 0, "Route unavailable", "OSRM route sync failed"));
        ui.nextInstruction.textContent = "Unable to load route";
        ui.nextInstructionMeta.textContent = "OSRM did not respond with a usable route.";
        ui.activeRoad.textContent = "Route unavailable";
        ui.stepSummary.textContent = "Check the network connection and try again.";
        ui.miniNextInstruction.textContent = "Route unavailable";
        alert("Unable to load route from OSRM right now. Please try again in a moment.");
    }
}

function bindStaticCopy() {
    ui.driverName.textContent = TRACKING_CONFIG.driver.name;
    ui.truckNumber.textContent = TRACKING_CONFIG.driver.truckNumber;
    ui.driverReference.textContent = TRACKING_CONFIG.driver.truckNumber;
    ui.businessReference.textContent = TRACKING_CONFIG.pickup.businessName;
    ui.businessName.textContent = TRACKING_CONFIG.pickup.businessName;
    ui.businessAddress.textContent = `${TRACKING_CONFIG.pickup.address} (${TRACKING_CONFIG.pickup.lat.toFixed(5)}, ${TRACKING_CONFIG.pickup.lng.toFixed(5)})`;
}

function setupMap() {
    state.map = L.map("map", {
        zoomControl: false,
        preferCanvas: true
    }).setView([TRACKING_CONFIG.driver.lat, TRACKING_CONFIG.driver.lng], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);

    L.control.zoom({ position: "bottomright" }).addTo(state.map);

    state.map.on("dragstart", disableFollowMode);
    state.map.on("zoomstart", disableFollowMode);
}

function setupControls() {
    ui.startNavigationButton.addEventListener("click", handleNavigationRequest);
    ui.widgetNavigationButton.addEventListener("click", handleNavigationRequest);
    ui.followButton.addEventListener("click", enableFollowMode);
    ui.overviewButton.addEventListener("click", showRouteOverview);
    ui.collapseButton.addEventListener("click", () => setWidgetMode(true));
    ui.expandWidgetButton.addEventListener("click", () => setWidgetMode(false));
    ui.expandWidgetButton.addEventListener("pointerdown", event => event.stopPropagation());

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && document.body.classList.contains("widget-mode")) {
            setWidgetMode(false);
        }
    });

    window.addEventListener("resize", () => {
        if (!state.panelHasCustomPosition) {
            positionBottomPanelDefault();
        }
        clampBottomPanelToViewport();
        if (!state.widgetHasCustomPosition) {
            positionWidgetDefault();
        }
        clampWidgetToViewport();
    });
}

async function handleNavigationRequest() {
    const navigationWindow = createNavigationWindow();
    setNavigationLoading(true);
    ui.navHint.textContent = "Checking current location before opening Google Maps.";

    try {
        const currentPosition = await getCurrentPosition();
        const url = buildGoogleMapsDirectionsUrl(
            currentPosition.coords.latitude,
            currentPosition.coords.longitude
        );
        openGoogleMapsDirections(url, navigationWindow);
        ui.navHint.textContent = "Google Maps opened with directions from your current location.";
    } catch (error) {
        const url = buildGoogleMapsDirectionsUrl();
        openGoogleMapsDirections(url, navigationWindow);
        ui.navHint.textContent = "Google Maps opened from the live truck position because browser location was unavailable.";
    } finally {
        setNavigationLoading(false);
    }
}

async function fetchRoute(origin, destination) {
    const url = `https://router.project-osrm.org/route/v1/${TRACKING_CONFIG.routeProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`OSRM request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
        throw new Error("OSRM did not return a route");
    }

    return data.routes[0];
}

function prepareRoute(route) {
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const cumulativeDistances = [0];
    let totalGeometryDistance = 0;

    for (let index = 1; index < coordinates.length; index += 1) {
        const segmentDistance = haversineMeters(coordinates[index - 1], coordinates[index]);
        totalGeometryDistance += segmentDistance;
        cumulativeDistances.push(totalGeometryDistance);
    }

    return {
        coordinates,
        cumulativeDistances,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        steps: buildRouteSteps(route, route.distance)
    };
}

function buildRouteSteps(route, totalDistance) {
    const steps = [];
    let stepDistanceCursor = 0;

    for (const leg of route.legs || []) {
        for (const step of leg.steps || []) {
            const startDistance = stepDistanceCursor;
            const stepDistance = Number(step.distance || 0);
            stepDistanceCursor += stepDistance;

            steps.push({
                instruction: buildStepInstruction(step),
                roadName: resolveRoadLabel(step),
                startDistance,
                endDistance: stepDistanceCursor,
                distanceMeters: stepDistance,
                durationSeconds: Number(step.duration || 0),
                type: step.maneuver?.type || "continue",
                modifier: step.maneuver?.modifier || "",
                location: Array.isArray(step.maneuver?.location)
                    ? {
                        lng: step.maneuver.location[0],
                        lat: step.maneuver.location[1]
                    }
                    : null
            });
        }
    }

    if (!steps.length) {
        steps.push({
            instruction: `Arrive at ${TRACKING_CONFIG.pickup.businessName}`,
            roadName: TRACKING_CONFIG.pickup.businessName,
            startDistance: 0,
            endDistance: totalDistance,
            distanceMeters: totalDistance,
            durationSeconds: 0,
            type: "arrive",
            modifier: "",
            location: {
                lat: TRACKING_CONFIG.pickup.lat,
                lng: TRACKING_CONFIG.pickup.lng
            }
        });
    } else {
        steps[steps.length - 1].endDistance = totalDistance;
        if (steps[steps.length - 1].type !== "arrive") {
            steps.push({
                instruction: `Arrive at ${TRACKING_CONFIG.pickup.businessName}`,
                roadName: TRACKING_CONFIG.pickup.businessName,
                startDistance: totalDistance,
                endDistance: totalDistance,
                distanceMeters: 0,
                durationSeconds: 0,
                type: "arrive",
                modifier: "",
                location: {
                    lat: TRACKING_CONFIG.pickup.lat,
                    lng: TRACKING_CONFIG.pickup.lng
                }
            });
        }
    }

    return steps;
}

function buildStepInstruction(step) {
    const type = step.maneuver?.type || "continue";
    const modifier = formatModifier(step.maneuver?.modifier);
    const road = resolveRoadLabel(step);
    let instruction = "";

    switch (type) {
        case "depart":
            instruction = road === "highlighted route"
                ? "Start on the highlighted route"
                : `Head ${modifier || "out"} on ${road}`;
            break;
        case "turn":
            instruction = road === "highlighted route"
                ? `Turn ${modifier || "ahead"}`
                : `Turn ${modifier || "ahead"} onto ${road}`;
            break;
        case "continue":
            instruction = road === "highlighted route"
                ? "Continue straight"
                : `Continue on ${road}`;
            break;
        case "new name":
            instruction = road === "highlighted route"
                ? "Continue on the highlighted route"
                : `Continue onto ${road}`;
            break;
        case "merge":
            instruction = road === "highlighted route"
                ? `Merge ${modifier || "ahead"}`
                : `Merge ${modifier || ""} onto ${road}`;
            break;
        case "fork":
            instruction = road === "highlighted route"
                ? `Keep ${modifier || "ahead"} at the fork`
                : `Keep ${modifier || "ahead"} to continue on ${road}`;
            break;
        case "on ramp":
            instruction = road === "highlighted route"
                ? `Take the ${modifier || ""} ramp`
                : `Take the ${modifier || ""} ramp to ${road}`;
            break;
        case "off ramp":
            instruction = road === "highlighted route"
                ? `Take the ${modifier || ""} exit`
                : `Take the ${modifier || ""} exit to ${road}`;
            break;
        case "end of road":
            instruction = `At the end of the road turn ${modifier || "ahead"}`;
            if (road !== "highlighted route") {
                instruction += ` onto ${road}`;
            }
            break;
        case "roundabout":
        case "rotary":
            instruction = road === "highlighted route"
                ? "Enter the roundabout"
                : `Enter the roundabout toward ${road}`;
            break;
        case "arrive":
            instruction = `Arrive at ${TRACKING_CONFIG.pickup.businessName}`;
            break;
        default:
            instruction = road === "highlighted route"
                ? "Stay on the highlighted route"
                : `Continue on ${road}`;
            break;
    }

    return instruction.replace(/\s+/g, " ").trim();
}

function resolveRoadLabel(step) {
    return step.name || step.ref || step.destinations || "highlighted route";
}

function drawRoute(routeData) {
    const latLngs = routeData.coordinates.map(point => [point.lat, point.lng]);

    state.routeShadow = L.polyline(latLngs, {
        color: "rgba(55, 115, 255, 0.28)",
        weight: 16,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
    }).addTo(state.map);

    state.routeLine = L.polyline(latLngs, {
        color: "#2f7cff",
        weight: 7,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
    }).addTo(state.map);

    runProgrammaticMapChange(() => {
        state.map.fitBounds(state.routeLine.getBounds(), {
            padding: [70, 70]
        });
    });
}

function addMarkers() {
    const pickupIcon = L.divIcon({
        className: "pickup-marker-wrapper",
        html: '<div class="pickup-marker"><div class="pickup-pin"></div></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 40]
    });

    const driverIcon = L.divIcon({
        className: "driver-marker-wrapper",
        html: `
            <div class="driver-marker">
                <div class="truck-pin">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5zm-14 10.5c-.83 0-1.5-.67-1.5-1.5S5.17 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm9-9h3.5l1.96 2.5H15V9.5zm2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });

    state.pickupMarker = L.marker(
        [TRACKING_CONFIG.pickup.lat, TRACKING_CONFIG.pickup.lng],
        { icon: pickupIcon }
    )
        .bindPopup(`${TRACKING_CONFIG.pickup.businessName}<br>${TRACKING_CONFIG.pickup.address}`)
        .addTo(state.map);

    state.driverMarker = L.marker(
        [TRACKING_CONFIG.driver.lat, TRACKING_CONFIG.driver.lng],
        { icon: driverIcon }
    )
        .bindPopup(`${TRACKING_CONFIG.driver.name} - ${TRACKING_CONFIG.driver.truckNumber}`)
        .addTo(state.map);
}

function startSimulation() {
    stopSimulation();
    state.elapsedSeconds = 0;
    state.currentSegmentIndex = 0;
    state.currentTravelledMeters = 0;

    state.simulationTimer = window.setInterval(() => {
        const maxElapsed = Math.ceil(state.routeData.durationSeconds);
        if (state.elapsedSeconds >= maxElapsed) {
            renderProgress(state.routeData.distanceMeters);
            setStatus("Driver arrived");
            stopSimulation();
            return;
        }

        state.elapsedSeconds += 1;
        const travelledMeters = Math.min(
            state.elapsedSeconds * state.speedMps,
            state.routeData.distanceMeters
        );
        renderProgress(travelledMeters);
    }, TRACKING_CONFIG.movementStepMs);
}

function stopSimulation() {
    if (state.simulationTimer) {
        window.clearInterval(state.simulationTimer);
        state.simulationTimer = null;
    }
}

function renderProgress(travelledMeters) {
    if (!state.routeData || !state.driverMarker) {
        return;
    }

    state.currentTravelledMeters = travelledMeters;
    const point = locatePointAlongRoute(travelledMeters);
    const remainingDistance = Math.max(state.routeData.distanceMeters - travelledMeters, 0);
    const remainingDuration = Math.max(
        state.routeData.durationSeconds - (travelledMeters / Math.max(state.speedMps, 1)),
        0
    );
    const progressRatio = state.routeData.distanceMeters <= 0
        ? 0
        : travelledMeters / state.routeData.distanceMeters;

    state.driverMarker.setLatLng([point.lat, point.lng]);
    rotateDriverMarker(point.bearing);
    updateMetrics(buildMetricPayload(
        formatDistance(remainingDistance),
        formatDuration(remainingDuration),
        formatArrivalTime(remainingDuration),
        progressRatio,
        `${Math.round(progressRatio * 100)}% completed`,
        remainingDistance <= 0
            ? "Truck has reached the business location"
            : `${formatDistance(remainingDistance)} left on the active route`
    ));
    updateGuidance(travelledMeters, remainingDistance, remainingDuration);
    setStatus(resolveStatus(remainingDistance));

    if (state.followDriver && state.map && !document.body.classList.contains("widget-mode")) {
        focusMapOnDriver(point);
    }
}

function locatePointAlongRoute(targetDistance) {
    const { coordinates, cumulativeDistances } = state.routeData;

    while (
        state.currentSegmentIndex < cumulativeDistances.length - 2 &&
        cumulativeDistances[state.currentSegmentIndex + 1] < targetDistance
    ) {
        state.currentSegmentIndex += 1;
    }

    const startIndex = state.currentSegmentIndex;
    const endIndex = Math.min(startIndex + 1, coordinates.length - 1);
    const startPoint = coordinates[startIndex];
    const endPoint = coordinates[endIndex];
    const startDistance = cumulativeDistances[startIndex];
    const endDistance = cumulativeDistances[endIndex];
    const segmentLength = Math.max(endDistance - startDistance, 0.0001);
    const segmentProgress = Math.min(
        Math.max((targetDistance - startDistance) / segmentLength, 0),
        1
    );

    return {
        lat: interpolate(startPoint.lat, endPoint.lat, segmentProgress),
        lng: interpolate(startPoint.lng, endPoint.lng, segmentProgress),
        bearing: calculateBearing(startPoint, endPoint)
    };
}

function updateGuidance(travelledMeters, remainingDistance, remainingDuration) {
    const steps = state.routeData.steps;
    const currentStepIndex = findCurrentStepIndex(travelledMeters);
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[Math.min(currentStepIndex + 1, steps.length - 1)];
    const highlightStep = nextStep || currentStep;
    const distanceToNextTurn = Math.max(currentStep.endDistance - travelledMeters, 0);
    const segmentName = formatRoadName(currentStep.roadName);

    ui.nextInstruction.textContent = highlightStep.instruction;
    ui.nextInstructionMeta.textContent = highlightStep.type === "arrive"
        ? `${formatDistance(remainingDistance)} to destination`
        : `${formatDistance(distanceToNextTurn)} to next maneuver`;
    ui.activeRoad.textContent = segmentName;
    ui.stepSummary.textContent = highlightStep.type === "arrive"
        ? `Destination ahead. ${formatDistance(remainingDistance)} remaining with about ${formatDuration(remainingDuration)} left.`
        : `Stay on ${segmentName} for ${formatDistance(distanceToNextTurn)}. Total remaining ${formatDistance(remainingDistance)} and about ${formatDuration(remainingDuration)}.`;
    ui.miniNextInstruction.textContent = highlightStep.type === "arrive"
        ? `Destination ahead · ${formatDistance(remainingDistance)} remaining`
        : `${highlightStep.instruction} · in ${formatDistance(distanceToNextTurn)}`;

    renderUpcomingSteps(currentStepIndex, travelledMeters);
    updateManeuverMarker(highlightStep);
}

function findCurrentStepIndex(travelledMeters) {
    const steps = state.routeData.steps;
    const index = steps.findIndex(step => travelledMeters < step.endDistance);
    return index === -1 ? steps.length - 1 : index;
}

function renderUpcomingSteps(currentStepIndex, travelledMeters) {
    ui.upcomingSteps.replaceChildren();
    const fragment = document.createDocumentFragment();
    const steps = state.routeData.steps.slice(currentStepIndex, currentStepIndex + 3);

    steps.forEach((step, index) => {
        const item = document.createElement("div");
        item.className = `step-item${index === 0 ? " is-active" : ""}`;

        const tag = document.createElement("div");
        tag.className = "step-tag";
        tag.textContent = index === 0 ? "Now" : index === 1 ? "Next" : "Later";

        const copy = document.createElement("div");
        copy.className = "step-copy";

        const title = document.createElement("div");
        title.className = "step-title";
        title.textContent = step.instruction;

        const meta = document.createElement("div");
        meta.className = "step-meta";
        meta.textContent = step.type === "arrive"
            ? "Destination"
            : index === 0
                ? `${formatDistance(Math.max(step.endDistance - travelledMeters, 0))} remaining on current segment`
                : `${formatDistance(step.distanceMeters)} after the turn`;

        copy.append(title, meta);
        item.append(tag, copy);
        fragment.append(item);
    });

    ui.upcomingSteps.append(fragment);
}

function updateManeuverMarker(step) {
    const fallbackLocation = {
        lat: TRACKING_CONFIG.pickup.lat,
        lng: TRACKING_CONFIG.pickup.lng
    };
    const target = step?.location || fallbackLocation;

    if (!target) {
        return;
    }

    if (!state.maneuverMarker) {
        state.maneuverMarker = L.circleMarker([target.lat, target.lng], {
            radius: 9,
            color: "#ffffff",
            weight: 2,
            fillColor: "#2f7cff",
            fillOpacity: 0.78
        }).addTo(state.map);
        return;
    }

    state.maneuverMarker.setLatLng([target.lat, target.lng]);
}

function focusMapOnDriver(point) {
    const latLng = [point.lat, point.lng];
    if (state.map.getZoom() < TRACKING_CONFIG.followZoom) {
        runProgrammaticMapChange(() => {
            state.map.setView(latLng, TRACKING_CONFIG.followZoom, {
                animate: true
            });
        });
        return;
    }

    runProgrammaticMapChange(() => {
        state.map.panTo(latLng, {
            animate: true,
            duration: 0.9
        });
    });
}

function enableFollowMode() {
    state.followDriver = true;
    updateFollowButton();

    if (state.driverMarker && state.map && !document.body.classList.contains("widget-mode")) {
        const driverLatLng = state.driverMarker.getLatLng();
        runProgrammaticMapChange(() => {
            state.map.setView(driverLatLng, Math.max(state.map.getZoom(), TRACKING_CONFIG.followZoom), {
                animate: true
            });
        });
    }
}

function disableFollowMode() {
    if (state.suppressFollowBreak || !state.followDriver) {
        return;
    }

    state.followDriver = false;
    updateFollowButton();
}

function showRouteOverview() {
    if (!state.routeLine || !state.map) {
        return;
    }

    state.followDriver = false;
    updateFollowButton();
    runProgrammaticMapChange(() => {
        state.map.fitBounds(state.routeLine.getBounds(), {
            padding: [70, 70]
        });
    });
}

function updateFollowButton() {
    ui.followButton.textContent = state.followDriver ? "Following Truck" : "Follow Truck";
    ui.followButton.classList.toggle("is-active", state.followDriver);
}

function updateMetrics(payload) {
    ui.distanceValue.textContent = payload.distanceText;
    ui.etaValue.textContent = payload.etaText;
    ui.arrivalValue.textContent = payload.arrivalText;
    ui.panelDistanceValue.textContent = payload.distanceText;
    ui.panelEtaValue.textContent = payload.etaText;
    ui.panelArrivalValue.textContent = payload.arrivalText;
    ui.progressValue.textContent = payload.progressText;
    ui.progressSubline.textContent = payload.progressSubline;
    ui.progressFill.style.width = `${Math.max(0, Math.min(payload.progressRatio, 1)) * 100}%`;
    ui.miniDistanceValue.textContent = payload.distanceText;
    ui.miniEtaValue.textContent = payload.etaText;
    ui.miniArrivalValue.textContent = payload.arrivalText;
}

function rotateDriverMarker(bearing) {
    const element = state.driverMarker.getElement();
    if (!element) {
        return;
    }

    const pin = element.querySelector(".truck-pin");
    if (pin) {
        pin.style.transform = `rotate(${bearing}deg)`;
    }
}

function setStatus(text) {
    ui.statusBadge.textContent = text;
    ui.miniStatus.textContent = text;
}

function setNavigationLoading(isLoading) {
    ui.startNavigationButton.disabled = isLoading;
    ui.widgetNavigationButton.disabled = isLoading;
    ui.startNavigationButton.textContent = isLoading ? "Locating..." : "Open Google Maps";
    ui.widgetNavigationButton.textContent = isLoading ? "Locating..." : "Google Maps";
}

function setWidgetMode(isEnabled) {
    document.body.classList.toggle("widget-mode", isEnabled);
    ui.miniWidget.hidden = !isEnabled;

    if (isEnabled) {
        state.followDriver = false;
        updateFollowButton();
        state.widgetDragPointerId = null;
        ui.miniWidget.classList.remove("is-dragging");
        positionWidgetDefault();
        clampWidgetToViewport();
    } else {
        state.panelDragPointerId = null;
        state.panelHasCustomPosition = false;
        ui.miniWidget.classList.remove("is-dragging");
        ui.bottomPanel.classList.remove("is-dragging");
        ui.bottomPanel.style.removeProperty("top");
        ui.bottomPanel.style.removeProperty("left");
        ui.bottomPanel.style.removeProperty("right");
        ui.bottomPanel.style.removeProperty("bottom");
        positionBottomPanelDefault();
        clampBottomPanelToViewport();
    }

    window.setTimeout(() => {
        if (state.map) {
            state.map.invalidateSize();
        }
    }, 150);
}

function initializeWidgetDrag() {
    ui.miniWidgetHandle.addEventListener("pointerdown", startWidgetDrag);
    window.addEventListener("pointermove", onWidgetDrag);
    window.addEventListener("pointerup", stopWidgetDrag);
    window.addEventListener("pointercancel", stopWidgetDrag);
}

function startWidgetDrag(event) {
    if (!document.body.classList.contains("widget-mode")) {
        return;
    }

    if (event.target.closest("button")) {
        return;
    }

    state.widgetDragPointerId = event.pointerId;
    state.widgetHasCustomPosition = true;

    const rect = ui.miniWidget.getBoundingClientRect();
    ui.miniWidget.classList.add("is-dragging");
    ui.miniWidget.setPointerCapture?.(event.pointerId);
    ui.miniWidget.style.right = "auto";
    ui.miniWidget.style.bottom = "auto";
    ui.miniWidget.style.left = `${rect.left}px`;
    ui.miniWidget.style.top = `${rect.top}px`;
    state.widgetDragOffsetX = event.clientX - rect.left;
    state.widgetDragOffsetY = event.clientY - rect.top;
}

function onWidgetDrag(event) {
    if (state.widgetDragPointerId !== event.pointerId) {
        return;
    }

    const maxLeft = window.innerWidth - ui.miniWidget.offsetWidth - 12;
    const maxTop = window.innerHeight - ui.miniWidget.offsetHeight - 12;
    const nextLeft = clamp(event.clientX - state.widgetDragOffsetX, 12, Math.max(12, maxLeft));
    const nextTop = clamp(event.clientY - state.widgetDragOffsetY, 12, Math.max(12, maxTop));

    ui.miniWidget.style.left = `${nextLeft}px`;
    ui.miniWidget.style.top = `${nextTop}px`;
}

function stopWidgetDrag(event) {
    if (event && state.widgetDragPointerId !== event.pointerId) {
        return;
    }

    state.widgetDragPointerId = null;
    ui.miniWidget.classList.remove("is-dragging");
}

function positionWidgetDefault() {
    if (!document.body.classList.contains("widget-mode") || state.widgetHasCustomPosition) {
        return;
    }

    if (window.innerWidth <= 720) {
        ui.miniWidget.style.left = "12px";
        ui.miniWidget.style.top = "12px";
        ui.miniWidget.style.right = "auto";
        ui.miniWidget.style.bottom = "auto";
        return;
    }

    ui.miniWidget.style.left = "auto";
    ui.miniWidget.style.right = "24px";
    ui.miniWidget.style.top = "24px";
    ui.miniWidget.style.bottom = "auto";
}

function clampWidgetToViewport() {
    if (ui.miniWidget.hidden || !state.widgetHasCustomPosition) {
        return;
    }

    const rect = ui.miniWidget.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 12;
    const maxTop = window.innerHeight - rect.height - 12;
    const nextLeft = clamp(rect.left, 12, Math.max(12, maxLeft));
    const nextTop = clamp(rect.top, 12, Math.max(12, maxTop));
    ui.miniWidget.style.left = `${nextLeft}px`;
    ui.miniWidget.style.top = `${nextTop}px`;
}

function initializePanelDrag() {
    ui.bottomPanelHandle.addEventListener("pointerdown", startPanelDrag);
    window.addEventListener("pointermove", onPanelDrag);
    window.addEventListener("pointerup", stopPanelDrag);
    window.addEventListener("pointercancel", stopPanelDrag);
    positionBottomPanelDefault();
}

function startPanelDrag(event) {
    if (document.body.classList.contains("widget-mode")) {
        return;
    }

    if (event.target.closest("button")) {
        return;
    }

    state.panelDragPointerId = event.pointerId;
    state.panelHasCustomPosition = true;

    const rect = ui.bottomPanel.getBoundingClientRect();
    ui.bottomPanel.classList.add("is-dragging");
    ui.bottomPanel.setPointerCapture?.(event.pointerId);
    ui.bottomPanel.style.right = "auto";
    ui.bottomPanel.style.bottom = "auto";
    ui.bottomPanel.style.left = `${rect.left}px`;
    ui.bottomPanel.style.top = `${rect.top}px`;
    state.panelDragOffsetX = event.clientX - rect.left;
    state.panelDragOffsetY = event.clientY - rect.top;
}

function onPanelDrag(event) {
    if (state.panelDragPointerId !== event.pointerId) {
        return;
    }

    const maxLeft = window.innerWidth - ui.bottomPanel.offsetWidth - 12;
    const maxTop = window.innerHeight - ui.bottomPanel.offsetHeight - 12;
    const nextLeft = clamp(event.clientX - state.panelDragOffsetX, 12, Math.max(12, maxLeft));
    const nextTop = clamp(event.clientY - state.panelDragOffsetY, 12, Math.max(12, maxTop));

    ui.bottomPanel.style.left = `${nextLeft}px`;
    ui.bottomPanel.style.top = `${nextTop}px`;
}

function stopPanelDrag(event) {
    if (event && state.panelDragPointerId !== event.pointerId) {
        return;
    }

    state.panelDragPointerId = null;
    ui.bottomPanel.classList.remove("is-dragging");
}

function positionBottomPanelDefault() {
    if (document.body.classList.contains("widget-mode") || state.panelHasCustomPosition) {
        return;
    }

    if (window.innerWidth <= 720) {
        ui.bottomPanel.style.left = "12px";
        ui.bottomPanel.style.right = "12px";
        ui.bottomPanel.style.top = "12px";
        ui.bottomPanel.style.bottom = "auto";
        return;
    }

    ui.bottomPanel.style.left = "16px";
    ui.bottomPanel.style.right = "auto";
    ui.bottomPanel.style.top = "16px";
    ui.bottomPanel.style.bottom = "auto";
}

function clampBottomPanelToViewport() {
    if (document.body.classList.contains("widget-mode") || !state.panelHasCustomPosition) {
        return;
    }

    const rect = ui.bottomPanel.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 12;
    const maxTop = window.innerHeight - rect.height - 12;
    const nextLeft = clamp(rect.left, 12, Math.max(12, maxLeft));
    const nextTop = clamp(rect.top, 12, Math.max(12, maxTop));
    ui.bottomPanel.style.left = `${nextLeft}px`;
    ui.bottomPanel.style.top = `${nextTop}px`;
}

function runProgrammaticMapChange(callback) {
    state.suppressFollowBreak = true;
    callback();
    window.setTimeout(() => {
        state.suppressFollowBreak = false;
    }, 600);
}

function createNavigationWindow() {
    const navigationWindow = window.open("", "_blank");
    if (navigationWindow) {
        navigationWindow.opener = null;
        navigationWindow.document.title = "Opening Google Maps";
        navigationWindow.document.body.style.cssText = "margin:0;background:#05070d;color:#ffffff;font:700 15px Inter,Segoe UI,sans-serif;display:grid;place-items:center;height:100vh;";
        navigationWindow.document.body.textContent = "Opening Google Maps navigation...";
    }
    return navigationWindow;
}

function buildGoogleMapsDirectionsUrl(originLat, originLng) {
    const { lat, lng } = TRACKING_CONFIG.pickup;
    const base = new URL("https://www.google.com/maps/dir/");
    base.searchParams.set("api", "1");
    base.searchParams.set("destination", `${lat},${lng}`);
    base.searchParams.set("travelmode", "driving");
    base.searchParams.set("dir_action", "navigate");

    const origin = resolveNavigationOrigin(originLat, originLng);
    if (origin) {
        base.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    }

    return base.toString();
}

function resolveNavigationOrigin(originLat, originLng) {
    if (typeof originLat === "number" && typeof originLng === "number") {
        return { lat: originLat, lng: originLng };
    }

    if (state.driverMarker) {
        const livePoint = state.driverMarker.getLatLng();
        return { lat: livePoint.lat, lng: livePoint.lng };
    }

    return {
        lat: TRACKING_CONFIG.driver.lat,
        lng: TRACKING_CONFIG.driver.lng
    };
}

function openGoogleMapsDirections(url, navigationWindow) {
    if (navigationWindow && !navigationWindow.closed) {
        navigationWindow.location.replace(url);
        navigationWindow.focus();
        return;
    }

    window.location.assign(url);
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is unavailable"));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 15000
        });
    });
}

function resolveStatus(remainingDistance) {
    if (remainingDistance <= 200) {
        return "Driver arrived";
    }
    if (remainingDistance <= 800) {
        return "Driver nearby";
    }
    if (remainingDistance <= 2500) {
        return "Driver arriving";
    }
    return "Driver en route";
}

function buildMetricPayload(distanceText, etaText, arrivalText, progressRatio, progressText, progressSubline) {
    return {
        distanceText,
        etaText,
        arrivalText,
        progressRatio,
        progressText,
        progressSubline
    };
}

function formatRoadName(roadName) {
    return roadName === "highlighted route" ? "Highlighted route" : roadName;
}

function formatDistance(distanceMeters) {
    if (distanceMeters >= 1000) {
        return `${(distanceMeters / 1000).toFixed(1)} km`;
    }
    return `${Math.max(0, Math.round(distanceMeters))} m`;
}

function formatDuration(durationSeconds) {
    const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
    }
    return `${totalMinutes} min`;
}

function formatArrivalTime(durationSeconds) {
    if (!Number.isFinite(durationSeconds)) {
        return "--";
    }

    const arrival = new Date(Date.now() + (durationSeconds * 1000));
    return arrival.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}

function formatModifier(modifier) {
    return modifier ? modifier.replace(/_/g, " ") : "";
}

function interpolate(start, end, progress) {
    return start + ((end - start) * progress);
}

function calculateBearing(start, end) {
    const lat1 = toRadians(start.lat);
    const lat2 = toRadians(end.lat);
    const deltaLng = toRadians(end.lng - start.lng);
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2)
        - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function haversineMeters(start, end) {
    const earthRadius = 6371000;
    const deltaLat = toRadians(end.lat - start.lat);
    const deltaLng = toRadians(end.lng - start.lng);
    const lat1 = toRadians(start.lat);
    const lat2 = toRadians(end.lat);
    const a = Math.sin(deltaLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toDegrees(value) {
    return (value * 180) / Math.PI;
}
