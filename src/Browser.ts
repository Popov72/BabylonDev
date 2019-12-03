export default class Browser {

    public static _qs: any = null;

    protected static _AudioContext: any = null;

    public static get AudioContext(): any {
        if (Browser._AudioContext === null) {
            Browser._AudioContext =
                typeof(AudioContext) != 'undefined' ? new AudioContext() :
                typeof((window as any).webkitAudioContext) != 'undefined' ? new (window as any).webkitAudioContext() :
                typeof((window as any).mozAudioContext) != 'undefined' ? new (window as any).mozAudioContext() : null;
        }
        return Browser._AudioContext;
    }

    public static bindRequestPointerLock(domElement: Element): void {
        domElement.requestPointerLock =
            domElement.requestPointerLock    ||
            (domElement as any).mozRequestPointerLock ||
            (domElement as any).webkitRequestPointerLock;
    }

    public static bindRequestFullscreen(domElement: Element): void {
        domElement.requestFullscreen =
            domElement.requestFullscreen    ||
            (domElement as any).mozRequestFullScreen ||
            (domElement as any).webkitRequestFullscreen ||
            (domElement as any).webkitRequestFullScreen;
    }

    public static get QueryString(): any {
        const query_string: any = {},
              query = window.location.search.substring(1),
              vars = query.split("&");

        for (let i = 0; i < vars.length; i++) {
            const pair = vars[i].split("=");

            // If first entry with this name
            if (typeof query_string[decodeURIComponent(pair[0])] === "undefined") {
                query_string[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            // If second entry with this name
            } else if (typeof query_string[decodeURIComponent(pair[0])] === "string") {
                var arr = [ query_string[decodeURIComponent(pair[0])], decodeURIComponent(pair[1]) ];
                query_string[decodeURIComponent(pair[0])] = arr;
            // If third or later entry with this name
            } else {
                query_string[decodeURIComponent(pair[0])].push(decodeURIComponent(pair[1]));
            }
        }

        Browser._qs = query_string;

        return Browser._qs;
    }
}
