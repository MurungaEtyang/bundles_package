
import EventEmitter from "events";

class GlobalTicker extends EventEmitter {
    constructor() {
        super();
        this._running = false;
    }

    start() {
        if (this._running) return;
        this._running = true;
        this._loop();
    }

    stop() {
        this._running = false;
    }

    _loop() {
        if (!this._running) return;
        const now = new Date();
        const sec = now.getSeconds();
        const ms = now.getMilliseconds();

        // If we are in the 59th second window (allow small window)
        if (sec === 59 && ms < 200) {
            // Emit once and then wait until next second to avoid duplicate emits
            this.emit("tick", new Date());
            // sleep a little to avoid multi-emits in the same second
            setTimeout(() => this._loop(), 300);
            return;
        }

        // check more frequently for accuracy
        setTimeout(() => this._loop(), 100);
    }
}

export const globalTicker = new GlobalTicker();
