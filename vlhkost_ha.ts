api_ha.connectToH(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
let CRLF: string = "" + "\u000D" + "\u000A"
let vlhkost: string = ""
let headers: string = ""
let data: string = ""
let ssid: string = "put_here_your_ssid"
let pwd: string = "put_here_your_password"
while (true) {
    basic.showNumber(1)
    api_ha.connectToWiFiNetwork(ssid, pwd)    
    if (api_ha.wifiState(true)) {
        basic.showNumber(2)
        vlhkost = pins.analogReadPin(AnalogPin.P1).toString()
        headers = "Content-Type: application/json" + CRLF
        data = "{" + CRLF + "\"humidity\":\"" + vlhkost + "\"" + CRLF + "}"
        headers = "" + headers + "Content-Length: " + data.length
        api_ha.executeHttpMethod(HttpMethod.POST, "192.168.0.2", 5050, "/api/appdaemon/microbit",headers, data)
        api_ha.disconnectFromWiFiNetwork()        
        basic.showNumber(0)
    } else {
        basic.showNumber(3)    
    }    
    basic.pause(30*1000)        
}
