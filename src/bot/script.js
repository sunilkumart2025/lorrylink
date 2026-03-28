const SYSTEM_PROMPT = `You are the Advanced LoadLink Logistics AI.

You are a deep expert in:
1. Indian Logistics Operations: GST norms, E-way bills, TDS (194C), and Transshipment.
2. App Features: Real-time tracking, Route optimization, Wallet/Earnings, and Chat-based negotiation.
3. Driver Support: Breakdown protocols, Toll/Fuel management, and Document verification.

Rules for response:
- Use clear, professional, yet simple English.
- provide actionable step-by-step guidance.
- If a question is about laws/taxes (GST/TDS), provide the Indian regulatory context (e.g., Section 194C for transporters).
- For app-specific issues, always suggest checking GPS/Internet or contacting Dispatch.
- ONLY answer questions related to logistics, trucking, and the LoadLink app.
- For non-logistics queries, politely redirect: "I specialize in LoadLink and logistics; I can't help with that."
`;

const LOADLINK_CONTEXT = `LoadLink Advanced Knowledge Base:

-- APP FEATURES --
- EARNINGS: Drivers see Gross Rate, Net Pay (after 2% platform fee), and Payout status in the Wallet.
- LIVE NAVIGATION: Uses OSRM for route paths and provides a "Time to Drop" metric.
- FREIGHT NETWORK: Shows nearby available loads using PostGIS proximity filtering.
- CHAT: Allows real-time price negotiation between Drivers and Shippers.

-- LOGISTICS EXPERTISE --
- GST: Goods and Services Tax. Transporters must issue a Consignment Note (LR/GR).
- E-WAY BILL: Required for moving goods worth > ₹50,000. Generated on the GST portal.
- TDS (194C): 1% for individuals/HUF and 2% for others, unless the driver owns <10 trucks and provides a declaration.
- DIESEL/TOLL: Expenses usually handled by the driver/fleet owner unless "Advance" is agreed.

-- EMERGENCY PROTOCOLS --
- BREAKDOWN: 1. Secure vehicle. 2. Contact Dispatcher via app chat. 3. Update status to 'stuck' if possible.
- ACCIDENTS: 1. Ensure safety. 2. Call emergency services and Dispatcher immediately.
- MISSING LOAD: 1. Check pickup location against GPS. 2. Contact Shipper via app.

-- TROUBLESHOOTING --
- No GPS: Ensure 'High Accuracy' is ON in device settings.
- App Lag: Clear cache or ensure 4G/5G connectivity.
`;

const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_TAGS_URL = "http://localhost:11434/api/tags";
const OLLAMA_TIMEOUT_MS = 45000;
const MODEL_PREFERENCES = ["phi3", "mistral"];
const OUT_OF_SCOPE_REPLY = "Sorry, I can only help with LoadLink app features.";
const GREETING_PATTERNS = [
    /^\s*hi+\s*$/i,
    /^\s*hello+\s*$/i,
    /^\s*hey+\s*$/i,
    /^\s*namaste+\s*$/i,
    /^\s*help+\s*$/i
];

const ROUTE_TO_PATTERN = /^\s*([a-z][a-z\s.-]+?)\s+to\s+([a-z][a-z\s.-]+?)\s*$/i;
const ROUTE_ETA_TO_PATTERN = /^\s*(?:eta|time|arrival)(?:\s+(?:for|to))?\s+([a-z][a-z\s.-]+?)\s+to\s+([a-z][a-z\s.-]+?)\s*$/i;
const ROUTE_FROM_TO_PATTERN = /^\s*(?:what\s+is\s+)?(?:the\s+)?(?:time|eta|distance|route)?\s*from\s+([a-z][a-z\s.-]+?)\s+to\s+([a-z][a-z\s.-]+?)\s*$/i;
const ROUTE_BETWEEN_PATTERN = /^\s*(?:what\s+is\s+)?(?:the\s+)?(?:time|eta|distance|route)?\s*(?:from\s+)?between\s+([a-z][a-z\s.-]+?)\s+and\s+([a-z][a-z\s.-]+?)\s*$/i;
const DESTINATION_QUERY_PATTERNS = [
    /^\s*(?:what\s+is\s+)?(?:the\s+)?(?:eta|time|arrival)\s+(?:for|to)\s+([a-z][a-z\s.-]+?)(?:\s+(?:journey|trip|delivery|route))?\s*$/i,
    /^\s*([a-z][a-z\s.-]+?)\s+(?:journey|trip|delivery|route)\s*$/i,
    /^\s*(?:to|for)\s+([a-z][a-z\s.-]+?)\s*$/i
];
const ETA_QUERY_PATTERNS = [
    /\bwhat is my eta\b/i,
    /\bwhat is eta\b/i,
    /\bwhat is the eta\b/i,
    /\beta\b/i,
    /\bwhat does eta mean\b/i,
    /\beta from\b/i,
    /\beta time\b/i,
    /\bwhen will it arrive\b/i,
    /\bhow much time left\b/i,
    /\barrival time\b/i,
    /\bhow long\b/i,
    /\btravel time\b/i,
    /\btime between\b/i,
    /\btime from\b/i,
    /\btime to reach\b/i,
    /\bwhat is the time between\b/i
];
const UNRELATED_PATTERNS = [
    /\bweather\b/i,
    /\brecipe\b/i,
    /\bmovie\b/i,
    /\bmusic\b/i,
    /\bpolitics?\b/i,
    /\bbitcoin\b/i,
    /\bstock(s)?\b/i,
    /\bfootball\b/i,
    /\bcricket\b/i,
    /\bjoke\b/i,
    /\bpoem\b/i,
    /\btranslate\b/i
];
const PLACE_STOPWORDS = new Set([
    "a", "active", "an", "and", "another", "are", "arrival", "arrive", "at", "begin", "break", "breakdown", "business",
    "by", "can", "check", "deliver", "delivery", "destination", "distance", "do", "driver", "eta",
    "different", "for", "from", "go", "google", "have", "help", "how", "i", "if", "in", "is", "issue", "journey",
    "left", "live", "loadlink", "location", "map", "maps", "mean", "my", "navigation", "no", "not",
    "of", "on", "open", "order", "other", "problem", "reach", "route", "same", "shipment", "show", "start", "the",
    "there", "this", "time", "to", "track", "tracking", "trip", "truck", "updating", "what", "when", "where",
    "which", "will", "with"
]);
const DRIVER_NO_TRIP_PATTERNS = [
    /\bdriver\b.*\bno\b.*\btrip\b/i,
    /\bno\b.*\btrip\b.*\bdriver\b/i,
    /\bdriver\b.*\bno\b.*\border\b/i,
    /\bno\b.*\border\b.*\bdriver\b/i
];
const BUSINESS_NO_TRUCK_PATTERNS = [
    /\bbusiness\b.*\bno\b.*\btruck\b/i,
    /\bno\b.*\btruck\b.*\bbusiness\b/i,
    /\bcustomer\b.*\bno\b.*\btruck\b/i,
    /\bdispatcher\b.*\bno\b.*\btruck\b/i
];
const EMBEDDED_FROM_TO_PATTERN = /\bfrom\s+([a-z][a-z\s./-]+?)\s+to\s+([a-z][a-z\s./-]+?)(?:\s|$)/i;
const ROAD_NAME_PATTERN = /\b(?:road|ring road|outer ring road|highway|expressway|flyover|bypass)\b/i;
const INFORMAL_DESTINATION_TERMS = [
    "home",
    "warehouse",
    "office",
    "yard",
    "depot",
    "base",
    "site",
    "shop",
    "store",
    "godown"
];

const ARTICLES = [
    {
        id: "book_truck",
        patterns: [
            /\b(book|get|need|want|arrange|hire)\b.*\b(truck|vehicle)\b/i,
            /\bbook\b.*\btrip\b/i,
            /\bcreate\b.*\btrip\b/i,
            /\bnew\b.*\btrip\b/i,
            /\bneed\b.*\btruck\b/i,
            /\bwant\b.*\btruck\b/i
        ],
        answer: question => {
            const routePair = extractEmbeddedRoutePair(question) || extractRoutePair(question);
            if (routePair) {
                state.pendingIntent = null;
                return buildBookingReply(routePair);
            }

            state.pendingIntent = "book_truck_route";
            return [
                "I can help with truck booking.",
                "Please send pickup and destination like Chennai to Madurai.",
                "If you are a driver and not a business user, tell me your trip problem."
            ].join("\n");
        }
    },
    {
        id: "start_delivery",
        patterns: [
            /\b(start|begin|resume)\b.*\b(delivery|trip|shipment|load|journey)\b/i,
            /\bhow to start delivery\b/i,
            /\bhow to start trip\b/i,
            /\bstart the trip\b/i
        ],
        answer: question => {
            const normalized = normalizeText(question);
            if (includesAny(normalized, ["business", "customer", "dispatcher"])) {
                return [
                    "To follow a delivery as a business user:",
                    "1. Open the live trip screen.",
                    "2. Check the moving truck on the map.",
                    "3. See Distance Left, Drive Time, and Arrives By.",
                    "4. Use Follow Truck if you want the map to stay on the truck."
                ].join("\n");
            }

            return [
                "To start delivery:",
                "1. Open your trip in LoadLink.",
                "2. Check pickup, destination, and the blue route.",
                "3. See Drive Time and Arrives By.",
                "4. Start moving on the shown route.",
                "5. Tap Open Google Maps if you want turn-by-turn navigation."
            ].join("\n");
        }
    },
    {
        id: "start_navigation",
        patterns: [
            /\bhow\b.*\bstart navigation\b/i,
            /\bstart navigation\b/i,
            /\bbegin navigation\b/i,
            /\bopen google maps\b/i
        ],
        answer: () => [
            "To start navigation:",
            "1. Open the trip in LoadLink.",
            "2. Check the route and destination.",
            "3. Tap Open Google Maps.",
            "4. Allow location access if asked.",
            "5. Follow Google Maps for turn-by-turn directions."
        ].join("\n")
    },
    {
        id: "track_truck",
        patterns: [
            /\bhow\b.*\btrack\b.*\btruck\b/i,
            /\btrack\b.*\btruck\b/i,
            /\btruck tracking\b/i,
            /\bhelp\b.*\btracking\b/i,
            /\blive location\b/i,
            /\bwhere is\b.*\btruck\b/i
        ],
        answer: () => [
            "To track a truck:",
            "1. Open the live tracking screen.",
            "2. Look for the moving truck on the map.",
            "3. Use Follow Truck to keep the truck centered.",
            "4. Check Distance Left, Drive Time, and Arrives By.",
            "5. Use Route Overview if you want the full trip path."
        ].join("\n")
    },
    {
        id: "eta",
        patterns: [
            /\bwhat is my eta\b/i,
            /\bwhat is eta\b/i,
            /\bwhat does eta mean\b/i,
            /\beta time\b/i,
            /\bwhen will it arrive\b/i,
            /\bhow much time left\b/i,
            /\barrival time\b/i,
            /\bhow long\b/i,
            /\btravel time\b/i,
            /\btime between\b/i,
            /\btime from\b/i,
            /\btime to reach\b/i,
            /\bwhat is the time between\b/i
        ],
        answer: question => {
            const routePair = extractRoutePair(question);
            if (routePair) {
                state.pendingIntent = null;
                return buildRouteEtaReply(routePair);
            }

            state.pendingIntent = "eta_trip";
            return [
                "ETA means when the truck should reach.",
                "In LoadLink:",
                "1. Drive Time = time left.",
                "2. Arrives By = expected arrival time.",
                "",
                "If you want trip ETA, send the route like Bengaluru to Mysore."
            ].join("\n");
        }
    },
    {
        id: "route_display",
        patterns: [
            /\broute display\b/i,
            /\bshow route\b/i,
            /\bblue line\b/i,
            /\bwhat does the route show\b/i
        ],
        answer: () => "The route display shows the road path from the truck to the destination. The moving truck shows the live vehicle position, the destination marker shows the stop, and the blue line shows the trip route."
    },
    {
        id: "route_guidance",
        patterns: [
            /\bwhat route should i take\b/i,
            /\bwhich route should i take\b/i,
            /\broute should i take\b/i,
            /\bwhich road should i take\b/i,
            /\bwhich way should i go\b/i,
            /\bwhere should i go\b/i
        ],
        answer: () => [
            "Use the blue route shown in LoadLink:",
            "1. Open the active trip.",
            "2. Follow the blue line on the map.",
            "3. Watch Drive Time and Arrives By while moving.",
            "4. Tap Open Google Maps if you want voice navigation."
        ].join("\n")
    },
    {
        id: "distance_metrics",
        patterns: [
            /\bdistance left\b/i,
            /\bdrive time\b/i,
            /\barrives by\b/i,
            /\bremaining distance\b/i
        ],
        answer: question => {
            const normalized = normalizeText(question);
            if (normalized.includes("distance")) {
                return "Distance Left is how far the truck is from the destination.";
            }

            if (normalized.includes("drive time")) {
                return "Drive Time is the travel time left on the current trip.";
            }

            return "Arrives By is the clock time when the truck should reach the destination.";
        }
    },
    {
        id: "route_issue",
        patterns: [
            /\broute\b.*\bnot showing\b/i,
            /\broute\b.*\bmissing\b/i,
            /\broute\b.*\bnot loading\b/i,
            /\bno route\b/i
        ],
        answer: () => [
            "If the route is not showing:",
            "1. Check that internet is on.",
            "2. Refresh the trip screen.",
            "3. Wait for the truck and destination to load.",
            "4. Use Route Overview after the route appears.",
            "5. If it still fails, reopen the trip."
        ].join("\n")
    },
    {
        id: "tracking_issue",
        patterns: [
            /\btruck\b.*\bnot updating\b/i,
            /\btracking\b.*\bnot updating\b/i,
            /\blive\b.*\bnot updating\b/i,
            /\btruck\b.*\bnot moving\b/i
        ],
        answer: () => [
            "If tracking is not updating:",
            "1. Check that the driver device has location permission enabled.",
            "2. Make sure the driver device has internet access.",
            "3. Wait a few seconds for the next location update.",
            "4. Refresh the business tracking screen.",
            "5. If ETA also stays stale, reopen the trip screen."
        ].join("\n")
    },
    {
        id: "google_maps_issue",
        patterns: [
            /\bgoogle maps\b.*\bnot opening\b/i,
            /\bnavigation\b.*\bnot opening\b/i,
            /\bcannot open google maps\b/i
        ],
        answer: () => [
            "If Google Maps is not opening:",
            "1. Tap Open Google Maps again.",
            "2. Allow location access if asked.",
            "3. Check that popups are not blocked.",
            "4. If the app is not installed, the browser route should still open.",
            "5. Refresh the page and try again."
        ].join("\n")
    },
    {
        id: "breakdown_issue",
        patterns: [
            /\bbreak\s*down\b/i,
            /\bbreakdown\b/i,
            /\btruck\b.*\bbroke\b/i,
            /\btruck\b.*\bstuck\b/i,
            /\bvehicle\b.*\bstuck\b/i
        ],
        answer: () => [
            "If the truck has a breakdown:",
            "1. Stop safely first.",
            "2. Keep the LoadLink trip open if possible.",
            "3. Inform the business side or dispatcher.",
            "4. Check the map again after the truck can move.",
            "5. The ETA and route will update when tracking starts moving again."
        ].join("\n")
    },
    {
        id: "no_order_issue",
        patterns: [
            /\bno\b.*\border\b/i,
            /\bno\b.*\btrip\b/i,
            /\bno\b.*\bload\b/i,
            /\btrip\b.*\bnot showing\b/i,
            /\border\b.*\bnot showing\b/i
        ],
        answer: question => {
            if (matchesAny(DRIVER_NO_TRIP_PATTERNS, question)) {
                return buildNoTripDriverReply();
            }

            if (matchesAny(BUSINESS_NO_TRUCK_PATTERNS, question)) {
                return buildNoTruckBusinessReply();
            }

            state.pendingIntent = "no_order_role";
            return [
                "Do you mean one of these?",
                "1. Driver: no trip is showing",
                "2. Business: no truck is showing",
                "",
                "Reply with driver no trip or business no truck."
            ].join("\n");
        }
    },
    {
        id: "gst_eway_bill",
        patterns: [
            /\bgst\b/i,
            /\be-way\b.*\bbill\b/i,
            /\be-waybill\b/i,
            /\beway bill\b/i,
            /\bconsignment note\b/i,
            /\blr\b.*\bgr\b/i
        ],
        answer: () => [
            "For GST and E-way bills:",
            "1. Goods worth > ₹50,000 need an E-way bill generated on the GST portal.",
            "2. Ensure you have the 'Part A' (goods detail) and 'Part B' (vehicle number) filled.",
            "3. Transporters must provide a Consignment Note (LR/GR) for every shipment.",
            "4. Check with your shipper if the E-way bill is ready before starting the trip."
        ].join("\n")
    },
    {
        id: "tds_payments",
        patterns: [
            /\btds\b/i,
            /\bpayment issue\b/i,
            /\bwhen will i get paid\b/i,
            /\btds deduction\b/i,
            /\b194c\b/i
        ],
        answer: () => [
            "About Payments and TDS (Section 194C):",
            "1. TDS is 1% for individuals and 2% for companies.",
            "2. If you own <10 trucks and provide a declaration with PAN, TDS may be 0%.",
            "3. Check your Wallet for 'Net Pay' after the 2% LoadLink fee.",
            "4. Payouts are usually processed within 24-48 hours of 'Delivered' status."
        ].join("\n")
    },
    {
        id: "maintenance_emergency",
        patterns: [
            /\bflat tire\b/i,
            /\bpuncture\b/i,
            /\bengine problem\b/i,
            /\bfuel\b/i,
            /\bdiesel\b/i,
            /\btoll\b/i
        ],
        answer: () => [
            "For Maintenance or Fuel issues:",
            "1. If it's an emergency, stop safely and use the app chat to inform the Shipper.",
            "2. Use FastTag for tolls to avoid delays.",
            "3. Fuel expenses are managed by the vehicle owner unless 'Advance Fuel' was agreed in the rate card.",
            "4. For major breakdowns, update your status in LoadLink so the ETA can recalculate."
        ].join("\n")
    },
    {
        id: "general_help",
        patterns: [
            /\bhow to use loadlink\b/i,
            /\bhow to use the app\b/i,
            /\bwhat can loadlink do\b/i,
            /\bwhat does loadlink do\b/i
        ],
        answer: () => [
            "LoadLink helps with:",
            "1. Live truck tracking & Route optimization.",
            "2. Distance, drive time, and 'Time to Drop' metrics.",
            "3. Digital Wallet for earnings & transparent payouts.",
            "4. Direct negotiation chat between drivers and business users.",
            "5. Automated trip documentation (coming soon)."
        ].join("\n")
    }
];

const state = {
    isSending: false,
    pendingIntent: null,
    pendingLabel: null,
    lastRoute: null,
    availableModels: [],
    activeModel: null,
    ollamaOnline: false
};

const ui = {
    chatLauncher: document.getElementById("chatLauncher"),
    chatPanel: document.getElementById("chatPanel"),
    closeChatButton: document.getElementById("closeChatButton"),
    connectionDot: document.getElementById("connectionDot"),
    connectionText: document.getElementById("connectionText"),
    chatMessages: document.getElementById("chatMessages"),
    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    sendButton: document.getElementById("sendButton"),
    quickActions: Array.from(document.querySelectorAll(".quick-action"))
};

if (ui.chatLauncher && ui.chatPanel) {
    initialize();
}

function initialize() {
    bindEvents();
    seedMessages();
    refreshOllamaStatus();
}

function bindEvents() {
    ui.chatLauncher.addEventListener("click", openChatPanel);
    ui.closeChatButton.addEventListener("click", closeChatPanel);
    ui.closeChatButton.addEventListener("pointerup", closeChatPanel);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeChatPanel(event);
        }
    });

    ui.chatForm.addEventListener("submit", handleSubmit);
    ui.chatInput.addEventListener("input", autoResizeInput);
    ui.chatInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            ui.chatForm.requestSubmit();
        }
    });

    ui.quickActions.forEach(button => {
        button.addEventListener("click", () => {
            ui.chatInput.value = button.dataset.question || "";
            autoResizeInput();
            openChatPanel();
            ui.chatForm.requestSubmit();
        });
    });
}

function seedMessages() {
    appendMessage(
        "assistant",
        "Namaste! I am your LoadLink AI. I can help with Truck Booking, Live Navigation, GST/E-way bill queries, and Breakdown support. What do you need help with?"
    );
}

function openChatPanel(event) {
    event?.preventDefault?.();
    document.body.classList.add("chat-open");
    ui.chatPanel.hidden = false;
    ui.chatPanel.setAttribute("aria-hidden", "false");
    ui.chatLauncher.setAttribute("aria-expanded", "true");
    window.setTimeout(() => ui.chatInput.focus(), 0);
}

function closeChatPanel(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    document.body.classList.remove("chat-open");
    ui.chatPanel.setAttribute("aria-hidden", "true");
    ui.chatLauncher.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
        if (!document.body.classList.contains("chat-open")) {
            ui.chatPanel.hidden = true;
        }
    }, 180);
}

async function handleSubmit(event) {
    event.preventDefault();
    if (state.isSending) {
        return;
    }

    const question = ui.chatInput.value.trim();
    if (!question) {
        appendMessage("assistant", "What do you need help with in LoadLink?");
        return;
    }

    openChatPanel();
    appendMessage("user", question);
    ui.chatInput.value = "";
    autoResizeInput();
    setSendingState(true);

    const typingMessage = appendTypingIndicator();

    try {
        const localReply = getDeterministicReply(question);
        if (localReply) {
            typingMessage.remove();
            appendMessage("assistant", localReply);
            return;
        }

        if (!state.ollamaOnline || !state.activeModel) {
            await refreshOllamaStatus();
        }

        if (state.ollamaOnline && state.activeModel) {
            const modelReply = await generateReply(question);
            typingMessage.remove();
            appendMessage("assistant", modelReply);
            return;
        }

        typingMessage.remove();
        appendMessage("assistant", buildClarifyingReply("", false));
    } catch (error) {
        typingMessage.remove();
        appendMessage("assistant", buildClarifyingReply("", false));
    } finally {
        setSendingState(false);
    }
}

function getDeterministicReply(question) {
    const normalized = normalizeText(question);
    const routePair = extractRoutePair(question);
    const embeddedRoutePair = extractEmbeddedRoutePair(question);
    const activeRoutePair = routePair || embeddedRoutePair;
    const destinationName = extractDestinationName(question);
    const etaQuestion = isEtaRelatedQuestion(question);
    const arrivalContext = extractArrivalContext(question);
    const article = findMatchingArticle(question);
    const keywordArticle = inferArticleFromKeywords(normalized);
    const roadReference = extractRoadReference(question);

    if (activeRoutePair) {
        state.lastRoute = activeRoutePair;
    }

    if (state.pendingIntent === "eta_trip" && activeRoutePair) {
        clearPendingState();
        return buildRouteEtaReply(activeRoutePair);
    }

    if (state.pendingIntent === "eta_trip" && isCurrentTripReply(normalized)) {
        const pendingLabel = state.pendingLabel;
        clearPendingState();
        return buildCurrentTripEtaReply(pendingLabel, state.lastRoute);
    }

    if (state.pendingIntent === "eta_trip" && isDifferentRouteReply(normalized)) {
        setPendingState("eta_trip");
        return "Send the new route like Bengaluru to Mysore so I can help with ETA.";
    }

    if (state.pendingIntent === "eta_trip" && destinationName) {
        clearPendingState();
        return buildDestinationEtaReply(destinationName);
    }

    if (state.pendingIntent === "eta_arrival_context" && activeRoutePair) {
        clearPendingState();
        return buildRouteEtaReply(activeRoutePair);
    }

    if (state.pendingIntent === "eta_arrival_context" && isCurrentTripReply(normalized)) {
        const pendingLabel = state.pendingLabel;
        clearPendingState();
        return buildCurrentTripEtaReply(pendingLabel, state.lastRoute);
    }

    if (state.pendingIntent === "eta_arrival_context" && destinationName) {
        clearPendingState();
        return buildDestinationEtaReply(destinationName);
    }

    if (state.pendingIntent === "eta_arrival_context" && isDifferentRouteReply(normalized)) {
        setPendingState("eta_trip");
        return "Okay. Send the route like Bengaluru to Mysore so I can help with arrival time.";
    }

    if (state.pendingIntent === "eta_arrival_context") {
        clearPendingState();
        return [
            "I can help with arrival time.",
            "Please send the route like Bengaluru to Mysore, or say current trip."
        ].join("\n");
    }

    if (state.pendingIntent === "book_truck_route" && activeRoutePair) {
        clearPendingState();
        return buildBookingReply(activeRoutePair);
    }

    if (state.pendingIntent === "book_truck_route") {
        if (normalized.includes("driver")) {
            clearPendingState();
            return "If you are a driver, tell me the trip problem. Example: start delivery, ETA, tracking, or route issue.";
        }

        return "Please send the route like Chennai to Madurai so I can help with booking.";
    }

    if (state.pendingIntent === "no_order_role") {
        if (matchesAny(DRIVER_NO_TRIP_PATTERNS, question) || includesAny(normalized, ["driver no trip", "driver no order"])) {
            clearPendingState();
            return buildNoTripDriverReply();
        }

        if (matchesAny(BUSINESS_NO_TRUCK_PATTERNS, question) || includesAny(normalized, ["business no truck", "customer no truck"])) {
            clearPendingState();
            return buildNoTruckBusinessReply();
        }

        return "Please reply with driver no trip or business no truck.";
    }

    if (isGreeting(question)) {
        clearPendingState();
        return "Hi. I can help with start delivery, truck tracking, ETA, route problems, or no trip issues. Tell me one problem.";
    }

    if (isObviouslyUnrelated(question)) {
        clearPendingState();
        return OUT_OF_SCOPE_REPLY;
    }

    if (activeRoutePair && etaQuestion) {
        clearPendingState();
        return buildRouteEtaReply(activeRoutePair);
    }

    if (destinationName && etaQuestion) {
        clearPendingState();
        return buildDestinationEtaReply(destinationName);
    }

    if (arrivalContext) {
        setPendingState("eta_arrival_context", arrivalContext.label);
        return buildArrivalFollowUpReply(arrivalContext.label, state.lastRoute);
    }

    if (roadReference) {
        clearPendingState();
        return buildRoadReply(roadReference, state.lastRoute);
    }

    if (article) {
        if (article.id !== "eta") {
            clearPendingState();
        }
        return article.answer(question);
    }

    if (keywordArticle) {
        if (keywordArticle.id !== "eta") {
            clearPendingState();
        }
        return keywordArticle.answer(question);
    }

    if (activeRoutePair) {
        clearPendingState();
        return buildRouteEtaReply(activeRoutePair);
    }

    if (destinationName) {
        clearPendingState();
        return buildDestinationEtaReply(destinationName);
    }

    if (state.pendingIntent === "eta_trip") {
        clearPendingState();
        return [
            "I still need the trip route for ETA.",
            "Send it like Bengaluru to Mysore.",
            "If you want something else, ask it directly."
        ].join("\n");
    }

    if (isLikelyLoadLinkQuestion(normalized) || etaQuestion) {
        return buildClarifyingReply(normalized, etaQuestion);
    }

    return buildClarifyingReply(normalized, etaQuestion);
}

function buildRouteEtaReply(routePair) {
    const route = formatRoutePair(routePair);
    state.lastRoute = routePair;
    return [
        `For ${route}:`,
        "1. Open this trip in LoadLink.",
        "2. Drive Time shows time left.",
        "3. Arrives By shows the arrival time.",
        "4. Watch the truck on the map for live progress.",
        "5. Tap Open Google Maps if you want voice navigation."
    ].join("\n");
}

function buildBookingReply(routePair) {
    const route = formatRoutePair(routePair);
    state.lastRoute = routePair;
    return [
        `To book a truck from ${toTitleCase(routePair[0])} to ${toTitleCase(routePair[1])}:`,
        "1. Open LoadLink as a business user.",
        "2. Create a new trip or booking.",
        `3. Enter pickup as ${toTitleCase(routePair[0])} and destination as ${toTitleCase(routePair[1])}.`,
        "4. Confirm the trip and wait for driver assignment.",
        "5. After assignment, open live tracking to watch the truck, route, and ETA."
    ].join("\n");
}

function buildDestinationEtaReply(destinationName) {
    const destination = toTitleCase(destinationName.trim());
    setPendingState("eta_trip", destinationName);
    return [
        `I can help with ETA for ${destination}.`,
        "Send the full route like Bengaluru to Mysore for trip-specific guidance.",
        "In LoadLink, Drive Time means time left and Arrives By means arrival time."
    ].join("\n");
}

function buildCurrentTripEtaReply(label, lastRoute) {
    if (lastRoute) {
        return [
            `For your ${formatRoutePair(lastRoute)} trip:`,
            "1. Open the trip in LoadLink.",
            "2. Drive Time shows time left.",
            "3. Arrives By shows when you should reach.",
            label ? `4. If ${label} means a different place, send that route also.` : "4. If you mean a different place, send that route also."
        ].join("\n");
    }

    return [
        label ? `If by ${label} you mean your current trip destination:` : "If you mean your current trip destination:",
        "1. Open the trip in LoadLink.",
        "2. Check Drive Time for time left.",
        "3. Check Arrives By for arrival time.",
        "4. If you want more exact help, send the route like Bengaluru to Mysore."
    ].join("\n");
}

function findMatchingArticle(question) {
    return ARTICLES.find(article => matchesAny(article.patterns, question)) || null;
}

function matchesAny(patterns, text) {
    return patterns.some(pattern => pattern.test(text));
}

function extractRoutePair(question) {
    const sanitizedQuestion = normalizeText(question);
    const patterns = [ROUTE_BETWEEN_PATTERN, ROUTE_FROM_TO_PATTERN, ROUTE_ETA_TO_PATTERN, ROUTE_TO_PATTERN];

    for (const pattern of patterns) {
        const match = sanitizedQuestion.match(pattern);
        if (match) {
            const start = cleanPlacePhrase(match[1]);
            const end = cleanPlacePhrase(match[2]);
            if (looksLikePlacePhrase(start) && looksLikePlacePhrase(end)) {
                return [start, end];
            }
        }
    }

    return null;
}

function extractEmbeddedRoutePair(question) {
    const sanitizedQuestion = normalizeText(question);
    const match = sanitizedQuestion.match(EMBEDDED_FROM_TO_PATTERN);
    if (!match) {
        return null;
    }

    const start = cleanPlacePhrase(match[1]);
    const end = cleanPlacePhrase(match[2]);
    if (looksLikePlacePhrase(start) && looksLikePlacePhrase(end)) {
        return [start, end];
    }

    return null;
}

function extractDestinationName(question) {
    const sanitizedQuestion = normalizeText(question);

    for (const pattern of DESTINATION_QUERY_PATTERNS) {
        const match = sanitizedQuestion.match(pattern);
        if (match) {
            const destination = cleanPlacePhrase(match[1]);
            if (looksLikePlacePhrase(destination)) {
                return destination;
            }
        }
    }

    return null;
}

function extractArrivalContext(question) {
    const normalized = normalizeText(question);

    if (!isArrivalLikeQuestion(normalized)) {
        return null;
    }

    const label = extractInformalDestinationLabel(normalized);
    if (label) {
        return { label };
    }

    if (
        normalized.includes("reach") ||
        normalized.includes("arrive") ||
        normalized.includes("get there")
    ) {
        return { label: null };
    }

    return null;
}

function formatRoutePair(routePair) {
    return routePair
        .map(part => part.trim())
        .filter(Boolean)
        .map(toTitleCase)
        .join(" to ");
}

function toTitleCase(text) {
    return text.replace(/\b([a-z])/gi, match => match.toUpperCase());
}

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[?!.,:;]+/g, "")
        .trim()
        .replace(/\s+/g, " ");
}

function includesAny(text, values) {
    return values.some(value => text.includes(value));
}

function setPendingState(intent, label = null) {
    state.pendingIntent = intent;
    state.pendingLabel = label;
}

function clearPendingState() {
    state.pendingIntent = null;
    state.pendingLabel = null;
}

function isGreeting(question) {
    return GREETING_PATTERNS.some(pattern => pattern.test(question));
}

function inferArticleFromKeywords(normalizedQuestion) {
    if (
        (normalizedQuestion.includes("book") || normalizedQuestion.includes("need") || normalizedQuestion.includes("want")) &&
        normalizedQuestion.includes("truck")
    ) {
        return findArticleById("book_truck");
    }

    if (normalizedQuestion.includes("create") && normalizedQuestion.includes("trip")) {
        return findArticleById("book_truck");
    }

    if (
        normalizedQuestion.includes("deliver") ||
        (normalizedQuestion.includes("start") && normalizedQuestion.includes("trip"))
    ) {
        return findArticleById("start_delivery");
    }

    if (normalizedQuestion.includes("eta") || normalizedQuestion.includes("arrival")) {
        return findArticleById("eta");
    }

    if (normalizedQuestion.includes("navigation") || normalizedQuestion.includes("google maps")) {
        return findArticleById("start_navigation");
    }

    if (
        (normalizedQuestion.includes("tracking") || normalizedQuestion.includes("track")) &&
        normalizedQuestion.includes("truck")
    ) {
        return findArticleById("track_truck");
    }

    if (
        normalizedQuestion.includes("route") &&
        (normalizedQuestion.includes("take") || normalizedQuestion.includes("go"))
    ) {
        return findArticleById("route_guidance");
    }

    if (
        normalizedQuestion.includes("road") &&
        (normalizedQuestion.includes("take") || normalizedQuestion.includes("go"))
    ) {
        return findArticleById("route_guidance");
    }

    if (normalizedQuestion.includes("help") && normalizedQuestion.includes("tracking")) {
        return findArticleById("track_truck");
    }

    if (normalizedQuestion.includes("breakdown") || normalizedQuestion.includes("break down")) {
        return findArticleById("breakdown_issue");
    }

    if (normalizedQuestion.includes("no order") || normalizedQuestion.includes("no trip")) {
        return findArticleById("no_order_issue");
    }

    return null;
}

function findArticleById(articleId) {
    return ARTICLES.find(article => article.id === articleId) || null;
}

function isLikelyLoadLinkQuestion(normalizedQuestion) {
    return [
        "loadlink",
        "delivery",
        "deliver",
        "book",
        "booking",
        "trip",
        "truck",
        "driver",
        "business",
        "tracking",
        "track",
        "route",
        "map",
        "navigation",
        "google maps",
        "eta",
        "distance",
        "arrival",
        "reach",
        "home",
        "warehouse",
        "pickup",
        "destination",
        "shipment",
        "dispatch",
        "breakdown",
        "order",
        "problem"
    ].some(keyword => normalizedQuestion.includes(keyword)) || Boolean(extractRoutePair(normalizedQuestion));
}

function isObviouslyUnrelated(question) {
    return UNRELATED_PATTERNS.some(pattern => pattern.test(question));
}

function isEtaRelatedQuestion(question) {
    return ETA_QUERY_PATTERNS.some(pattern => pattern.test(question));
}

function isArrivalLikeQuestion(normalizedQuestion) {
    return (
        /\bwhen\b.*\breach\b/i.test(normalizedQuestion) ||
        /\bwhen\b.*\barrive\b/i.test(normalizedQuestion) ||
        /\bwhen\b.*\bget home\b/i.test(normalizedQuestion) ||
        /\bwhen\b.*\bget there\b/i.test(normalizedQuestion) ||
        /\breach home\b/i.test(normalizedQuestion) ||
        /\breach warehouse\b/i.test(normalizedQuestion) ||
        /\breach office\b/i.test(normalizedQuestion) ||
        /\barrive home\b/i.test(normalizedQuestion)
    );
}

function extractInformalDestinationLabel(normalizedQuestion) {
    const term = INFORMAL_DESTINATION_TERMS.find(value => normalizedQuestion.includes(value));
    return term || null;
}

function isCurrentTripReply(normalizedQuestion) {
    return [
        "current trip",
        "this trip",
        "active trip",
        "same trip",
        "current load",
        "same route",
        "same load"
    ].some(value => normalizedQuestion.includes(value));
}

function isDifferentRouteReply(normalizedQuestion) {
    return [
        "different route",
        "another route",
        "other route",
        "different trip",
        "another trip"
    ].some(value => normalizedQuestion.includes(value));
}

function buildClarifyingReply(normalizedQuestion, etaQuestion) {
    if (etaQuestion) {
        setPendingState("eta_trip");
        return [
            "I can help with ETA.",
            "Tell me the trip route like Bengaluru to Mysore.",
            "Drive Time means time left. Arrives By means arrival time."
        ].join("\n");
    }

    if (isArrivalLikeQuestion(normalizedQuestion)) {
        setPendingState("eta_arrival_context", extractInformalDestinationLabel(normalizedQuestion));
        return buildArrivalFollowUpReply(state.pendingLabel, state.lastRoute);
    }

    if ((normalizedQuestion.includes("track") || normalizedQuestion.includes("tracking")) && normalizedQuestion.includes("truck")) {
        return "Do you want to see the truck on the map, or is tracking not updating?";
    }

    if (normalizedQuestion.includes("route")) {
        return "Do you want to see the route on the map, or do you want navigation help?";
    }

    if (normalizedQuestion.includes("breakdown") || normalizedQuestion.includes("break down")) {
        return findArticleById("breakdown_issue").answer(normalizedQuestion);
    }

    if (normalizedQuestion.includes("no order") || normalizedQuestion.includes("no trip")) {
        return findArticleById("no_order_issue").answer(normalizedQuestion);
    }

    if (normalizedQuestion.includes("delivery") || normalizedQuestion.includes("deliver") || normalizedQuestion.includes("trip")) {
        return "Do you want to start delivery, check ETA, or track the truck?";
    }

    if (normalizedQuestion.includes("book") || normalizedQuestion.includes("booking")) {
        setPendingState("book_truck_route");
        return "Do you want to book a truck? Send pickup and destination like Chennai to Madurai.";
    }

    return "Tell me the problem in simple words. Example: start delivery, track truck, ETA, route not showing, or no trip.";
}

function buildArrivalFollowUpReply(label, lastRoute) {
    const place = label ? ` ${label}` : "";
    if (lastRoute) {
        return [
            `I can help with when you may reach${place}.`,
            `Is this about your current ${formatRoutePair(lastRoute)} trip, or a different route?`,
            "Reply with current trip or send the route."
        ].join("\n");
    }

    return [
        `I can help with when you may reach${place}.`,
        "Is this your current trip destination, or a different route?",
        "Reply with current trip or send the route like Bengaluru to Mysore."
    ].join("\n");
}

function extractRoadReference(question) {
    const original = question.trim();
    const normalized = normalizeText(question);

    if (!ROAD_NAME_PATTERN.test(normalized) && !normalized.startsWith("via ")) {
        return null;
    }

    const cleaned = original
        .replace(/^\s*(via|through)\s+/i, "")
        .replace(/[()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) {
        return null;
    }

    return cleaned;
}

function buildRoadReply(roadReference, routePair) {
    const road = roadReference.trim();
    if (routePair) {
        return [
            `If your ${formatRoutePair(routePair)} trip goes by ${road}:`,
            "1. Check the blue route on the LoadLink map.",
            "2. Follow the road shown on the map.",
            "3. Watch Drive Time and Arrives By for updates.",
            "4. Tap Open Google Maps if you want exact turns or another road."
        ].join("\n");
    }

    return [
        `If you mean ${road}:`,
        "1. Open the trip and check the blue route on the map.",
        "2. LoadLink shows the road path for the current trip.",
        "3. Tap Open Google Maps if you need exact turns or alternate roads."
    ].join("\n");
}

function cleanPlacePhrase(text) {
    return normalizeText(text)
        .replace(/\//g, " ")
        .replace(/\b(journey|trip|delivery|route)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function looksLikePlacePhrase(text) {
    const normalized = cleanPlacePhrase(text);
    const tokens = normalized.split(" ").filter(Boolean);

    if (!tokens.length || tokens.length > 4) {
        return false;
    }

    if (tokens.some(token => PLACE_STOPWORDS.has(token))) {
        return false;
    }

    return tokens.join("").replace(/[^a-z]/g, "").length >= 3;
}

function buildNoTripDriverReply() {
    return [
        "If you are a driver and no trip is showing:",
        "1. Refresh or reopen LoadLink.",
        "2. Check if a trip was assigned to you.",
        "3. Wait for the next trip if nothing is assigned yet.",
        "4. If a trip should already be there, contact the business side or dispatcher."
    ].join("\n");
}

function buildNoTruckBusinessReply() {
    return [
        "If you are a business user and no truck is showing:",
        "1. Open the correct live trip.",
        "2. Check that a driver was assigned.",
        "3. Wait for the next location update.",
        "4. Refresh the tracking screen if the map is still empty."
    ].join("\n");
}

function setSendingState(isSending) {
    state.isSending = isSending;
    ui.sendButton.disabled = isSending;
    ui.quickActions.forEach(button => {
        button.disabled = isSending;
    });
    ui.sendButton.textContent = isSending ? "Sending..." : "Send";
}

function appendMessage(role, content) {
    const message = document.createElement("article");
    message.className = `message message--${role}`;

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = role === "user" ? "You" : "LoadLink Assistant";

    const body = document.createElement("div");
    body.textContent = content;

    message.append(label, body);
    ui.chatMessages.append(message);
    scrollMessagesToBottom();
    return message;
}

function appendTypingIndicator() {
    const message = document.createElement("article");
    message.className = "message message--assistant";

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = "LoadLink Assistant";

    const row = document.createElement("div");
    row.className = "typing-row";

    for (let index = 0; index < 3; index += 1) {
        const dot = document.createElement("span");
        dot.className = "typing-dot";
        row.append(dot);
    }

    message.append(label, row);
    ui.chatMessages.append(message);
    scrollMessagesToBottom();
    return message;
}

function scrollMessagesToBottom() {
    ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;
}

function autoResizeInput() {
    ui.chatInput.style.height = "auto";
    ui.chatInput.style.height = `${Math.min(ui.chatInput.scrollHeight, 140)}px`;
}

async function refreshOllamaStatus() {
    try {
        const response = await fetchWithTimeout(OLLAMA_TAGS_URL, {
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Ollama status failed with ${response.status}`);
        }

        const data = await response.json();
        state.availableModels = Array.isArray(data.models) ? data.models.map(model => model.name) : [];
        state.activeModel = selectModel(state.availableModels);
        state.ollamaOnline = true;
        updateRuntimeState();
    } catch (error) {
        state.availableModels = [];
        state.activeModel = null;
        state.ollamaOnline = false;
        updateRuntimeState();
    }
}

function updateRuntimeState() {
    if (state.ollamaOnline && state.activeModel) {
        ui.connectionDot.className = "connection-dot is-online";
        ui.connectionText.textContent = `Built-in answers ready · ${state.activeModel} fallback available`;
        return;
    }

    ui.connectionDot.className = "connection-dot";
    ui.connectionText.textContent = "Built-in LoadLink answers ready";
}

function selectModel(models) {
    const normalized = models.map(model => model.toLowerCase());
    for (const preference of MODEL_PREFERENCES) {
        const matchIndex = normalized.findIndex(model => model === preference || model.startsWith(`${preference}:`));
        if (matchIndex !== -1) {
            return models[matchIndex];
        }
    }

    return null;
}

async function generateReply(question) {
    const response = await fetchWithTimeout(OLLAMA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: state.activeModel,
            system: SYSTEM_PROMPT,
            prompt: `${LOADLINK_CONTEXT}\n\nUser question:\n${question}\n\nAnswer for LoadLink only.`,
            stream: false,
            options: {
                temperature: 0.15,
                num_predict: 180
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama generate failed with ${response.status}`);
    }

    const data = await response.json();
    const answer = typeof data.response === "string" ? data.response.trim() : "";
    if (!answer) {
        throw new Error("Ollama returned an empty response.");
    }

    return answer;
}

function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => {
        window.clearTimeout(timeoutId);
    });
}

window.LoadLinkAssistant = {
    getDeterministicReply,
    openChatPanel,
    closeChatPanel,
    buildRouteEtaReply
};
