
/**
 * Použijte tento soubor k definování personalizovaných funkcí a bloků.
 * Přečtěte si více na https://makecode.microbit.org/blocks/custom
 */

 enum MyEnum {
    //% block="one"
    One,
    //% block="two"
    Two
}
enum HttpMethod {
    GET,
    POST,
    PUT,
    HEAD,
    DELETE,
    PATCH,
    OPTIONS,
    CONNECT,
    TRACE
}

enum Newline {
    CRLF,
    LF,
    CR
}



/**
 * Personalizované bloky
 */
//% weight=100 color=#0fbc11 icon=""
namespace api_ha {
    let CRLF: string = "\u000D" + "\u000A"
    let pauseBaseValue: number = 1000
    let wifi_connected: boolean = false
    let comm_retval: string = ""

    /**
     * TODO: popište vaši funkci zde
     * @param n popište parametr zde, eg: 5
     * @param s popište parametr zde, eg: "Hello"
     * @param e popište parametr zde
     */
    //% block
    export function foo(n: number, s: string, e: MyEnum): void {
        // Add code here
    }
    
    function sendAT(data: string, waitTime: number=0): void {
        serial.writeString(data + "\u000D" + "\u000A")
        basic.pause(waitTime)        
    }
    /**
     * Make a serial connection between micro:bit and WiFi:bit.
     */
     //% block="set ESP8266|RX %tx|TX %rx|Baud rate %baudrate"
     //% tx.defl=SerialPin.P8
     //% rx.defl=SerialPin.P12
     //% ssid.defl=your_ssid
     //% pw.defl=your_password weight=100
    export function connectToH(tx: SerialPin, rx: SerialPin, baudrate: BaudRate) {
        serial.redirect(
            tx,
            rx,
            baudrate        
        )
        sendAT("AT+RESTORE", 1000) // restore to factory settings
        sendAT("AT+CWMODE=1") // set to STA mode
        basic.pause(1000)
    }

    export function wifiState(state: boolean) {
        if (wifi_connected == state) {
            return true
        }
        else {
            return false
        }
    }

    export function commRetval(): string {
        return comm_retval
    }

    /**
     * Connect to WiFi network.
     * @param ssid SSID, eg: "SSID"
     * @param key Key, eg: "key"
     */
    //% weight=99
    //% blockId="h_wifi_on" block="connect to WiFi network %ssid, %key"
    export function connectToWiFiNetwork(ssid: string, key: string): void {
        wifi_connected = false
        // Connect to AP:
        sendAT("AT+CWJAP=\"" + ssid + "\",\"" + key + "\"", 0)
        let serial_str: string = ""
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
            if (serial_str.length > 50)
                serial_str = serial_str.substr(serial_str.length - 50)
            if (serial_str.includes("WIFI GOT IP") || serial_str.includes("OK")) {
                serial_str=""
                wifi_connected = true
                break
            }
            if (serial_str.includes("FAIL")) {
                serial_str=""
                wifi_connected = false
                connectToWiFiNetwork(ssid,key)
                break
            }
            if (serial_str.includes("WIFI CONNECTED")){}
            else if(input.runningTime() - time > 10000) {
                wifi_connected = false
                connectToWiFiNetwork(ssid,key)
                break
            }
        }
        basic.pause(2000)
    }

    /**
     * Disconnect from WiFi network.
     */
    //% weight=98
    //% blockId="h_wifi_off" block="disconnect from WiFi network"
    export function disconnectFromWiFiNetwork(): void {
        // Disconnect from AP:
        sendAT("AT+CWQAP", 6000)
    }

    /**
     * Execute AT command.
     * @param command AT command, eg: "AT"
     * @param waitTime Wait time after execution, eg: 1000
     */
    //% weight=97
    //% blockId="wfb_at" block="execute AT command %command and then wait %waitTime ms"
    export function executeAtCommand(command: string, waitTime: number): void {
        sendAT(command, waitTime)
    }
    

    /**
     * Execute HTTP method.
     * @param method HTTP method, eg: HttpMethod.GET
     * @param host Host, eg: "google.com"
     * @param port Port, eg: 80
     * @param urlPath Path, eg: "/search?q=something"
     * @param headers Headers
     * @param body Body
     */
    //% weight=96
    //% blockId="wfb_http" block="execute HTTP method %method|host: %host|port: %port|path: %urlPath||headers: %headers|body: %body"
    export function executeHttpMethod(method: HttpMethod, host: string, port: number, urlPath: string, headers?: string, body?: string): void {
        let myMethod: string
        switch (method) {
            case HttpMethod.GET: myMethod = "GET"; break;
            case HttpMethod.POST: myMethod = "POST"; break;
            case HttpMethod.PUT: myMethod = "PUT"; break;
            case HttpMethod.HEAD: myMethod = "HEAD"; break;
            case HttpMethod.DELETE: myMethod = "DELETE"; break;
            case HttpMethod.PATCH: myMethod = "PATCH"; break;
            case HttpMethod.OPTIONS: myMethod = "OPTIONS"; break;
            case HttpMethod.CONNECT: myMethod = "CONNECT"; break;
            case HttpMethod.TRACE: myMethod = "TRACE";
        }
        // Establish TCP connection:
        let data: string = "AT+CIPSTART=\"TCP\",\"" + host + "\"," + port
        sendAT(data, pauseBaseValue * 6)
        data = myMethod + " " + urlPath + " HTTP/1.1" + "\u000D" + "\u000A"            
        if (headers && headers.length > 0) {
            data += headers + "\u000D" + "\u000A"
        }
        if (data && data.length > 0) {
            data += "\u000D" + "\u000A" + body + "\u000D" + "\u000A"
        }
        data += "\u000D" + "\u000A"

        // Send data:
        sendAT("AT+CIPSEND=" + (data.length + 2), pauseBaseValue * 3)
        comm_retval = ""
        let time: number = input.runningTime()
        while (true) {
            comm_retval += serial.readString()
            if (comm_retval.length > 100)
            comm_retval = comm_retval.substr(comm_retval.length - 100)
            if (comm_retval.includes("CONNECT") || comm_retval.includes("OK")){                
                break
            }
            if (comm_retval.includes("ERROR") || comm_retval.includes("CLOSED")) {                
                break
            }
            if (input.runningTime() - time > 10000) {
                comm_retval = "0"
            }
        }
        sendAT(data, pauseBaseValue * 6)




        // Close TCP connection:
        sendAT("AT+CIPCLOSE", pauseBaseValue * 3)
    }

    function waitResponse(): boolean {
        let serial_str: string = ""
        let result: boolean = false
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
            if (serial_str.length > 200)
                serial_str = serial_str.substr(serial_str.length - 200)
            if (serial_str.includes("WIFI GOT IP")) {
                result = true
                break
            }
            else if (input.runningTime() - time > 10000) {
                break
            }
        }
        return result
    }

}
