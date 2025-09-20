# 🚨 CrowdControl Troubleshooting Guide

If your site isn't accessible, follow these steps. **99% of issues are solved by Step 1 & 2.**

---

### **✅ Step 1: Run the Universal Launcher as Administrator**

This is the most important step.

1.  **Right-click** on the `START_APP_NOW.bat` file.
2.  Select **"Run as administrator"**. 

This is required to configure the firewall correctly.

---

### **✅ Step 2: Check Your Wi-Fi Network**

Your computer and your mobile device **MUST** be on the **SAME** Wi-Fi network.

-   **On your computer:** Check the Wi-Fi name in the bottom-right corner.
-   **On your phone/iPad:** Go to Wi-Fi settings and check the network name.

They must match exactly.

---

### **✅ Step 3: Use the Correct IP Address**

The `START_APP_NOW.bat` script will tell you the correct IP address to use. It will look something like this:

```
Your Primary IP Address is: 192.168.1.26
```

On your phone or iPad, type this address into your browser, followed by `:5174`.

-   **Example:** `http://192.168.1.26:5174`

---

### **✅ Step 4: Check if Servers are Actually Running**

When you run the script, two new black command prompt windows should appear:

1.  **Backend Server Window:** Will show lines starting with `[...` and mention `Django`.
2.  **Frontend Server Window:** Will show a blue `VITE` logo and list `Local` and `Network` URLs.

If these windows close immediately or show errors, the servers are not running.

---

### **🚨 Still Not Working? Advanced Steps**

If you've done all the above and it's still not working, try these.

#### **1. Temporarily Disable Your Firewall**

Sometimes, antivirus or firewall software can block the connection.

1.  Go to **Start Menu** -> **Windows Security**.
2.  Click on **Firewall & network protection**.
3.  Click on your active network (usually **Private network**).
4.  Turn the **Microsoft Defender Firewall** switch to **Off**.
5.  **Try accessing the site again.**

**IMPORTANT:** Remember to turn your firewall back on after you're done!

#### **2. Check for Network Isolation**

Some Wi-Fi networks (especially public or guest networks) have a feature called "AP Isolation" or "Client Isolation" that prevents devices from seeing each other. 

-   **Solution:** Try a different network, like your home Wi-Fi or a mobile hotspot.

#### **3. Use a Mobile Hotspot**

This is a great way to test if your Wi-Fi is the problem.

1.  **Turn on the mobile hotspot** on your phone.
2.  **Connect your computer** to your phone's hotspot Wi-Fi.
3.  **Run `START_APP_NOW.bat` as administrator** again.
4.  The script will give you a new IP address. Use that new IP to access the site from your phone.

---

### **Summary Checklist**

-   [ ] Did you **run `START_APP_NOW.bat` as an administrator**?
-   [ ] Are your computer and mobile device on the **exact same Wi-Fi network**?
-   [ ] Did you use the **IP address shown by the script**?
-   [ ] Are the **two server windows still open** and running without errors?
-   [ ] Have you tried **temporarily disabling your firewall**?

Following these steps should resolve any connection issues.
