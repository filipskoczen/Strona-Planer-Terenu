# 🔧 Geoportal Import - Testing & Troubleshooting Guide

## Quick Test

1. **Open the application** - Start the Land Planner
2. **Create a project** - Set dimensions to at least 50x50 meters
3. **Click Import button** (📋) - In the toolbar
4. **Enter plot number** - Try "162" 
5. **Use default TERYT codes** - 12, 34, 46 (Warsaw area)
6. **Click Importuj** - Click to import

## Expected Behavior

✅ **On Success:**
- Green message: "✅ Zaimportowano działkę..."
- A gray semi-transparent polygon appears on canvas
- "Działka" label visible above/near the polygon
- Polygon is selectable (click to select)

## Debugging the Polygon

### Step 1: Check Console Logs

Open DevTools (F12) and look for these logs in order:

```
🔍 Searching for plot...
TERYT: 123446
Plot number: 162
```

Then one of:
```
✅ Plot found: {type: 'Feature', ...}      // API succeeded (unlikely in browser)
⚠️  WFS query failed...                    // Expected - DNS/CORS
⚠️  GUGiK API failed, returning example plot  // Expected - CORS blocked
```

### Step 2: Check Coordinate Logs

Look for these detailed logs:

```
📍 Extracted coordinates: [[0, 0], [25, 0], [25, 25], [0, 25], [0, 0]]
📦 Plot bounds: {centerX: 12.5, centerY: 12.5, minX: 0, maxX: 25, minY: 0, maxY: 25, width: 25, height: 25}
📐 Relative coordinates (for rendering): [[-12.5, -12.5], [12.5, -12.5], [12.5, 12.5], [-12.5, 12.5], [-12.5, -12.5]]
✅ Plot element created: {id: "...", name: "001/2024", position: {x: 12.5, y: 12.5}, size: {width: 25, height: 25}, coordsCount: 5}
```

**What to check:**
- ✅ Coordinates extracted correctly
- ✅ Bounds calculated (width and height should be > 0)
- ✅ Relative coordinates are negative and positive offsets
- ✅ Element created with position and size

### Step 3: Check Layer Rendering

The polygon should appear:
- **Position**: Somewhere on the canvas (depends on project center)
- **Color**: Gray (#9ca3af) with 40% opacity
- **Shape**: Closed polygon (square for example plot)
- **Size**: 25x25 meters (750x750 pixels at 30 pixels/meter)

### Step 4: Verify in Layers Panel

Check the left sidebar:
1. Open "Warstwy" (Layers)
2. Should see "📍 Działka 001/2024" in the list
3. Click it - polygon should be selected
4. Toggle visibility icon (👁️) - polygon should show/hide

## Common Issues & Fixes

### Issue: Polygon not visible

**Check 1: Zoom & Pan**
- Click "Fit View" button (⊡) to fit all elements
- Scroll/drag to navigate canvas
- Polygon might be outside current view

**Check 2: Polygon is too small**
- Zoom in (+ button) to 200-300%
- Example plot is only 25x25 meters
- At 30 pixels/meter = 750x750 pixels = still quite small

**Check 3: Element has locked visibility**
- Check layers panel
- Click 👁️ icon to toggle visibility
- Should see "🚫" (hidden) or "👁️" (visible)

**Check 4: Polygon color blends with background**
- Click to select polygon
- Properties panel should show color: #9ca3af
- Try changing opacity or color to test

### Issue: Element not in Layers

**Solution:**
- Check console errors
- Element.fromJSON() might fail
- Project.addElement() might fail
- See ERROR DETAILS below

### Issue: API Calls Failing (Expected)

**Why:**
- CORS policy blocks browser-based API calls to geoportal.gov.pl
- DNS resolution fails in some environments
- Falls back to example plot (this is OK)

**Workaround:**
1. Use a CORS proxy (for production):
   - Change API URL to: `https://cors-anywhere.herokuapp.com/https://wms.geoportal.gov.pl/wfs`
   - Or: `https://api.allorigins.win/raw?url=https://wms.geoportal.gov.pl/wfs`

2. Or use Node.js backend to proxy API calls

## ERROR DETAILS

### TypeError: Cannot read property 'properties'
**Cause:** plotData is null or undefined  
**Fix:** Check if API returned valid data

### "Could not extract coordinates from plot"
**Cause:** Geometry missing or invalid  
**Fix:** Verify GeoJSON structure

### "Could not create plot element"
**Cause:** Coordinates transformation failed  
**Fix:** Check bounds calculation

### "Cannot read property 'addElement'"
**Cause:** Project object is null  
**Fix:** Create project first before importing

## Performance Notes

**For testing with many plots:**
- Each polygon stores all boundary coordinates
- Large polygons (1000+ points) may be slow
- Recommended: Simplify polygon geometry before import

## Code Flow for Reference

```
User clicks "Import" button
↓
openImportPlotModal() opens modal dialog
↓
User enters plot info and clicks "Importuj"
↓
handleImportPlot() validates input
↓
GeoportalManager.importPlot() 
  ├→ queryParcelsByNumber() tries WFS API
  └→ queryUsingPublicAPI() tries alternative API
     └→ getExamplePlot() returns fallback data
↓
createPlotElement() creates Element object with coordinates
↓
project.addElement() adds to project model
↓
canvasManager.addElement() renders polygon on canvas
↓
updateLayersList() updates left sidebar
↓
showMessage() notifications
```

## Testing Checklist

- [ ] Can open import modal
- [ ] Can enter plot number
- [ ] API queries attempt (check console)
- [ ] Falls back to example plot
- [ ] Polygon renders on canvas
- [ ] Can select polygon
- [ ] Can see in layers panel
- [ ] Can change properties
- [ ] Undo/Redo works
- [ ] Can export project with plot

## Visual Verification

**After import, you should see:**
```
Canvas area with:
- Gray grid background
- Blue land plot rectangle (project boundary)
- Gray semi-transparent polygon (imported plot)
- "Działka" label above polygon

Left sidebar:
- "📍 Działka 001/2024" in layers list

Bottom info:
- No error messages
- Success notification
```

## Browser DevTools Tips

**To inspect polygon:**
1. Right-click on polygon → Inspect
2. In console, run: `canvasManager.elementsLayer.children[0]`
3. Check its properties and coordinates

**To dump all elements:**
```javascript
window.projectManager.getAllElements().forEach(e => {
  console.log(e.name, 'at', e.x, e.y, 'Shape:', e.shape)
})
```

## Still Not Working?

👉 **Check:**
1. Browser console (F12) for error messages
2. Network tab - API requests
3. That project was created before import
4. That "Import" button exists and is clickable

💡 **Share these logs:**
```javascript
// Run in console:
console.log('Project:', window.projectManager.getProject());
console.log('Elements:', window.projectManager.getAllElements());
console.log('Canvas ready:', window.canvasManager.elementsLayer ? 'YES' : 'NO');
```
