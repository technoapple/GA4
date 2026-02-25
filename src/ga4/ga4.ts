import { ga4Option } from "./ga4option";
import { DataLayerObject } from "../types/dataLayer";
import { KeyValueParams, gtag } from "../types/gtag";
import { GA4Plugin, SendFunction } from "../types/plugins";
import {} from '../types/global';

class ga4 {

    private static instance: ga4;
    private _plugins: GA4Plugin[] = [];

    private constructor() {
    }

    public init(option:ga4Option){
        window.dataLayer = window.dataLayer || Array<DataLayerObject>;
        window.gtag = window.gtag || function() {
            window.dataLayer.push(arguments);
        }
        window.gtag('js', new Date());
        window.gtag('config', option.targetId);
    }

    public static getInstance():ga4 {
        if (!ga4.instance) {
            ga4.instance = new ga4();
        }               
        return ga4.instance;
    }

    public send(eventName:string, eventParameters: KeyValueParams ): boolean {

        window.gtag('event', eventName, eventParameters);

        return true;
    }

    /**
     * Register a plugin with the GA4 instance.
     * @param PluginClass The plugin class constructor
     * @param options Plugin-specific configuration options
     * @returns The plugin instance (call `.remove()` to unregister)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public use<T extends GA4Plugin>(
        PluginClass: new (send: SendFunction, options?: any) => T,
        options?: any
    ): T {
        const send: SendFunction = (eventName: string, params: Record<string, unknown>) => {
            window.gtag('event', eventName, params as KeyValueParams);
        };
        const plugin = new PluginClass(send, options);
        this._plugins.push(plugin);
        return plugin;
    }

    /**
     * Remove all registered plugins and clean up their listeners.
     */
    public removeAll(): void {
        this._plugins.forEach(p => p.remove());
        this._plugins = [];
    }

    get gtag() : gtag {
        return window.gtag;
    }
}

export {ga4};