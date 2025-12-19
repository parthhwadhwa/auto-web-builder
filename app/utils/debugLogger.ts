// Stub file - functionality removed for simplification
export const debugLogger = {
    getStatus: () => ({ initialized: false, capturing: false, enabled: false }),
    log: () => { },
    warn: () => { },
    error: () => { },
    captureLog: () => { },
};

export async function downloadDebugLog() {
    console.log('Debug logging has been disabled');
}
