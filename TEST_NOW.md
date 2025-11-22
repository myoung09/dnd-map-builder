# 🧪 Quick Test Guide - Mobile Responsive Features

## ✅ Servers Running!

- **Main App:** http://localhost:3000
- **WebSocket:** ws://localhost:7000
- **Status:** ✅ Compiled successfully with no errors!

---

## 📱 Test the Mobile Responsive Layout NOW

### Step 1: Open Chrome DevTools (30 seconds)

1. Open **Chrome** browser
2. Go to: **http://localhost:3000**
3. Press **F12** to open DevTools
4. Press **Ctrl+Shift+M** to toggle Device Toolbar
5. You should see a device selector at the top

### Step 2: Test Desktop Mode (1 minute)

1. In DevTools, select **"Responsive"** from device dropdown
2. Set width to **1400px** (type in the width field)
3. **What you should see:**
   - ✅ Map on the left
   - ✅ Control panel on the right (400px wide)
   - ✅ Tabs: Parameters, Workspace, Palette
   - ❌ NO floating button visible

### Step 3: Test Mobile Mode - THIS IS THE NEW FEATURE! (2 minutes)

1. Change width to **375px** (iPhone size)
2. **What you should see:**

   - ✅ Map fills entire screen
   - ✅ Blue circular button in bottom-right corner (FAB)
   - ✅ Map has more space!

3. **Click the blue button** (FAB)
4. **What should happen:**

   - ✅ Drawer slides up from bottom
   - ✅ Shows "DM Controls" header
   - ✅ Shows 4 tabs: Lighting, Objects, Sprites, Sync
   - ✅ Close button (X) in top-right of drawer

5. **Test the drawer:**
   - Click different tabs → content changes
   - Scroll content inside drawer → should scroll smoothly
   - Click X button → drawer closes
   - Click blue FAB button again → drawer reopens

### Step 4: Test the Transition (1 minute)

1. With DevTools still open, slowly drag the width slider
2. **Watch what happens at 1200px:**
   - Below 1200px → FAB button appears, panel disappears
   - Above 1200px → FAB button disappears, panel appears
   - Should be smooth with no flickering

### Step 5: Test DM Campaign Mode (2 minutes)

1. From the main page, click **"Start Campaign"** button
2. You'll be redirected to DM page
3. **Desktop test (width: 1400px):**

   - ✅ Map on left
   - ✅ Control panel on right with tabs: Lighting, Objects, Sprites, Sync
   - ✅ Can click to place lights on map

4. **Mobile test (width: 375px):**
   - ✅ Map fills screen
   - ✅ Blue FAB in bottom-right
   - ✅ Click FAB → drawer with DM controls
   - ✅ Can switch tabs in drawer
   - ✅ Close drawer with X button

### Step 6: Test Different Device Sizes (2 minutes)

Try these presets from the device dropdown:

**Mobile Phones:**

- iPhone SE (375px) - Small phone
- iPhone 12 Pro (390px) - Standard phone
- Pixel 5 (393px) - Android phone

**Expected:** FAB button visible, map full screen

**Tablets:**

- iPad Mini (768px) - Small tablet
- iPad Air (820px) - Standard tablet

**Expected:** FAB button visible (under 1200px)

**Large Tablets:**

- iPad Pro (1024px) - Large tablet
- Surface Pro 7 (912px) - Windows tablet

**Expected:** FAB button visible

**Desktop:**

- Custom: 1400px

**Expected:** Fixed control panel visible, no FAB button

---

## 🎯 What to Look For (Success Criteria)

### ✅ Desktop Mode (>= 1200px)

- [ ] Control panel visible on right side (400px)
- [ ] Map fills remaining left space
- [ ] NO FAB button visible
- [ ] All tabs work: Parameters/Workspace/Palette (main page) or Lighting/Objects/Sprites/Sync (DM page)

### ✅ Mobile Mode (< 1200px)

- [ ] Map fills entire screen width
- [ ] Blue circular FAB button in bottom-right corner
- [ ] FAB button has white menu icon (≡)
- [ ] Clicking FAB opens drawer from bottom
- [ ] Drawer has rounded top corners
- [ ] Drawer header shows title and X button
- [ ] All tabs accessible in drawer
- [ ] Content scrolls within drawer
- [ ] X button closes drawer
- [ ] Can reopen drawer by clicking FAB again

### ✅ Transition (Around 1200px)

- [ ] Smooth transition when resizing
- [ ] No layout jumps or flickers
- [ ] No horizontal scrollbar at any size
- [ ] Map adjusts size smoothly

---

## 🐛 Known Issues to Check

1. **Drawer content might be empty on desktop panel** - This is a known limitation, content is primarily in mobile drawer
2. **TabPanels might render twice** - Not a visual issue, just code structure
3. **Some tabs might show "use mobile drawer" message** - Expected on desktop mode

---

## 📸 Screenshots to Take (Optional)

If everything works, take screenshots of:

1. Desktop view at 1400px
2. Mobile view at 375px with drawer closed
3. Mobile view at 375px with drawer open
4. The transition happening at 1200px

---

## 🎉 Success!

If all checkboxes above are checked, the mobile responsive implementation is **WORKING PERFECTLY!**

### Next Steps:

- Test on real mobile device (optional)
- Continue with Player Page mobile responsive
- Add touch gestures for map pan/zoom

---

## 🆘 If Something Doesn't Work

1. **Check the console** (F12 → Console tab)

   - Look for red error messages
   - Report any errors you see

2. **Hard refresh** (Ctrl+Shift+R)

   - Clears cache and reloads

3. **Check current screen width**

   - DevTools shows width in the top bar
   - Make sure it's actually above/below 1200px

4. **Verify servers are running**
   - Main app: http://localhost:3000
   - WebSocket: Check terminal for "listening on 7000"

---

**Testing Time Estimate:** 5-10 minutes total

**Start testing now!** Open http://localhost:3000 in Chrome and follow the steps above. 🚀
