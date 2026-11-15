PulseTap NFC Manufacturing Bridge
=================================

Windows requirements
--------------------
1. Install the official driver for your ACS or compatible PC/SC NFC reader.
2. Connect the reader by USB.
3. Keep bridge.py and start-bridge.bat in the same folder.
4. Double-click start-bridge.bat.
5. Keep the bridge window open while using the PulseTap manufacturing app.

The bridge listens only on http://localhost:17322 and lets the signed-in
PulseTap website communicate with the reader attached to this computer.

Supported reader interface
--------------------------
The bridge uses Windows PC/SC. It supports the ACS ACR122U and is designed
to work with compatible PC/SC NFC reader/writers. Reader and tag support can
vary by driver, firmware and chip type.

Troubleshooting
---------------
- If Windows cannot find Python, install Python 3 and enable "Add to PATH".
- If the reader is not detected, install its official Windows driver.
- Allow Python through Windows Firewall only for private/local access.
- Open Reader Status in the manufacturing app after the bridge starts.

PulseTap: https://www.pulse-tap.com
