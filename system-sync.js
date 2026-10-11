(function () {
    "use strict";

    const STORAGE_KEY = "earist-solar-lighting-state";
    const DEFAULT_STATE = {
        ambientLux: 0,
        batteryPct: 82,
        overrideMode: "AUTO",
        isWifiConnected: true,
        commandLogs: [
            { id: "CMD-104", user: "admin_cpe", command: "RETURN_AUTO", time: "2026-10-11 08:05:12", status: "EXECUTED" },
            { id: "CMD-103", user: "admin_cpe", command: "FORCE_ON", time: "2026-10-11 07:45:00", status: "EXECUTED" },
            { id: "CMD-102", user: "tech_maint", command: "FORCE_OFF", time: "2026-10-10 18:30:22", status: "EXECUTED" }
        ]
    };
    const listeners = new Set();

    function validateState(value) {
        if (!value || typeof value !== "object" ||
            !Number.isFinite(value.ambientLux) || value.ambientLux < 0 || value.ambientLux > 1000 ||
            !Number.isFinite(value.batteryPct) || value.batteryPct < 0 || value.batteryPct > 100 ||
            !["AUTO", "FORCE_ON", "FORCE_OFF"].includes(value.overrideMode) ||
            typeof value.isWifiConnected !== "boolean" ||
            !Array.isArray(value.commandLogs)) {
            throw new Error("Stored dashboard state is invalid. Clear this site's local storage and reload.");
        }
        return value;
    }

    function readStoredState(serialized) {
        if (serialized === null) {
            return { ...DEFAULT_STATE, commandLogs: DEFAULT_STATE.commandLogs.slice() };
        }
        return validateState(JSON.parse(serialized));
    }

    let state = readStoredState(localStorage.getItem(STORAGE_KEY));

    function snapshot() {
        return JSON.parse(JSON.stringify(state));
    }

    function notify() {
        const current = snapshot();
        listeners.forEach(function (listener) {
            listener(current);
        });
    }

    window.addEventListener("storage", function (event) {
        if (event.key === STORAGE_KEY && event.newValue !== null) {
            state = readStoredState(event.newValue);
            notify();
        }
    });

    window.SystemSync = {
        getState: snapshot,
        update: function (patch) {
            const nextState = validateState({ ...state, ...patch });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
            state = nextState;
            notify();
        },
        subscribe: function (listener) {
            listeners.add(listener);
            listener(snapshot());
            return function () {
                listeners.delete(listener);
            };
        },
        escapeHtml: function (value) {
            return String(value).replace(/[&<>"']/g, function (character) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[character];
            });
        }
    };
})();
