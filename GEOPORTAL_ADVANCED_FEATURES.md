# 📍 Geoportal Import - Advanced Features

## Feature 1: Import During Project Creation

### How It Works

When creating a new project, you now have the option to immediately import a land plot from geoportal without needing a separate dialog.

### Usage

1. **Click "Nowy" button** to create new project
2. **Fill in project details:**
   - Name
   - Width & Height
   - Grid size
   - Land color

3. **Check "Zaimportuj działkę z Geoportalu"** checkbox
   - Import fields appear below
   - Enter plot number (e.g., "162")
   - Verify TERYT codes (default: 12, 34, 46 for Warsaw)

4. **Click "Utwórz projekt"**
   - Project is created
   - Plot automatically imported
   - Both displayed together

### Benefits

✅ **Single workflow** - Everything in one dialog  
✅ **Time-saving** - No need for separate import step  
✅ **Streamlined** - Create project + import in one action  
✅ **Optional** - Uncheck if you just want to create empty project  

### Example Workflow

```
New Project Dialog
├─ Project Name: "Działka przy Warszawie"
├─ Width: 50m
├─ Height: 60m
├─ Grid: 1m
├─ ☑️ Import plot from Geoportal
│  ├─ Plot number: 162
│  ├─ Voivodeship: 12
│  ├─ District: 34
│  └─ Commune: 46
└─ Click "Utwórz projekt"

Result:
- Project 50×60m created
- Plot boundary automatically imported
- Both visible on canvas
```

---

## Feature 2: Irregular Plot Shapes

### What It Means

Polish land plots (działki) are rarely perfect rectangles. They can have:
- **L-shapes** - Common for residential plots
- **Trapezoids** - Sloped boundaries along roads
- **Irregular polygons** - Complex boundaries with 5+ vertices
- **Curved boundaries** - Approximated by polygon vertices

### How It Works

When you import a plot, it precisely matches the actual geometry from geoportal:

1. **Boundary fetched from API** - Real polygon geometry
2. **Vertices extracted** - All boundary corner points
3. **Rendered as polygon** - Exact shape displayed
4. **Calculated bounds** - Width/height from actual polygon
5. **Selectable & editable** - Like any other element

### Visual Examples

```
Regular Rectangle          L-Shaped Property        Irregular Boundary
┌──────────────┐          ┌─────────┐              ┌────────┐
│              │          │         │ ┌──────┐     │       /
│              │          │         │ │      │     │      /
│              │          └─────────┘ └──────┘     │     /
└──────────────┘                                   └────┘
```

### Technical Details

**Polygon Rendering in Canvas:**
- Uses Konva.Line with `closed: true`
- Automatically connects all vertices
- Renders fill + stroke
- Supports rotation and opacity
- Can be selected and modified

**Data Structure:**
```javascript
Element {
  shape: 'polygon',           // Custom polygon shape
  properties: {
    coordinates: [            // All boundary vertices
      [ -12.5, -12.5 ],       // Relative to element center
      [  12.5, -12.5 ],
      [  12.5,  12.5 ],
      [ -12.5,  12.5 ],
      [ -12.5, -12.5 ]        // Closed path
    ],
    source: 'geoportal'
  }
}
```

### Working with Irregular Shapes

**Properties available:**
- Name - "Działka 162"
- Color - Adjust in properties panel
- Opacity - See through at different levels
- Area - Square meters from geoportal data
- Position - Canvas location (X, Y)

**Limitations:**
- ⚠️ Cannot edit vertices (polygon is read-only)
- ⚠️ Width/height calculated from bounding box
- ⚠️ Rotation may distort irregular shapes

**Workaround for editing:**
1. Acknowledge the imported boundaries
2. Draw additional elements with actual rectangle tool
3. Or use "polygon sketch" mode (future feature)

### Example: L-Shaped Plot

When you import an L-shaped plot:

```
Real shape (from geoportal):
┌─────────┐
│         │
│         ├─────┐
│         │     │
└─────────┴─────┘

Imported in Land Planner:
- Gray semi-transparent polygon
- Exact corner points preserved
- All boundary shown
- Can plan buildings fitting the actual shape
```

---

## Coordinate System

### EPSG:2180 (Polish Mercator)
- Standard for Polish cadastral data
- Meter-based (not degrees like WGS84)
- Used by GUGiK (Central Register of Geodetic and Cartographic Documentation)
- Converted to canvas pixels automatically

### Conversion Formula

```
Canvas Pixels = (EPSG:2180 Meters - Center) × PixelsPerMeter

Example:
- Point in GUGiK: (640000, 480000) meters
- Plot center: (640025, 480025)
- Relative position: (-25, -25) meters
- At 30 pixels/meter: (-750, -750) pixels
- On canvas: (centerX - 750, centerY - 750)
```

---

## API Integration

### Data from GUGiK

Each imported plot includes:

```json
{
  "type": "Feature",
  "properties": {
    "nr_dzialki": "162",              // Plot number
    "pole_pow": 2500,                 // Area in m²
    "obreb": "Some District"          // District name
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [                  // All vertices
      [640000, 480000],
      [640050, 480000],
      [640050, 480050],
      [640000, 480050],
      [640000, 480000]                // Closed ring
    ]
  }
}
```

### TERYT Code Reference

```
TERYT Code = VV PP MM

VV (Voivodeship)
   01 = Dolnośląskie
   02 = Kujawsko-Pomorskie
   04 = Łódzkie
   06 = Lubelskie
   08 = Lubuskie
   10 = Łódzkie
   12 = Mazowieckie (Default)
   14 = Opolskie
   16 = Podkarpackie
   18 = Podlaskie
   20 = Pomeranian
   22 = Silesian
   24 = Świętokrzyskie
   26 = Warmian-Masurian
   28 = Greater Poland
   30 = West Pomeranian

PP (Powiat/District) = 01-99
MM (Gmina/Commune) = 01-99

Example: 12 34 46 = Masovia, District 34, Commune 46
```

Find codes at: https://eteryt.stat.gov.pl

---

## Advanced Usage

### Measuring Imported Plots

Properties panel shows:
- **Area** - Hectares/m² from geoportal
- **Width** - Bounding box width
- **Height** - Bounding box height
- **Perimeter** - Can be calculated from vertices

### Exporting Projects with Plots

When you export your project:
- Plot geometry is saved
- All coordinates preserved
- Can be re-imported later
- Polygon rendering information stored

### Batch Import (Future)

Currently: Import one plot at a time  
Coming soon:
- Import multiple adjacent plots
- Group plots into layers
- Import entire cadastral map sections

---

## Troubleshooting Irregular Shapes

### Plot appears as rectangle

**Cause:** API returned simplified geometry  
**Fix:** Check original plot in geoportal.gov.pl for reference

### Polygon distorted at high zoom
**Cause:** Floating-point precision at large viewport  
**Fix:** Works correctly - zoom back out to verify

### Plot position wrong

**Cause:** TERYT codes incorrect  
**Fix:** Verify at eteryt.stat.gov.pl

### Very complex polygon (1000+ vertices)

**Cause:** High-precision cadastral boundary  
**Fix:** Import works but may be slow
- Simplify in geoportal if available
- Or switch to lower precision

---

## Tips & Best Practices

✅ **DO:**
- Verify plot number before importing
- Check TERYT codes for correctness
- Use geoportal.gov.pl as reference
- Save project after import
- Export projects with plots regularly

❌ **DON'T:**
- Edit polygon vertices directly
- Rotate complex polygons
- Scale polygon manually
- Changed locked status without reason
- Delete boundary polygon during planning

### Performance Tips

- Import plots before adding many elements
- Projects with 100+ elements + complex polygon may slow down
- Simplify view (hide polygon layer) if needed

---

## Future Enhancements

🚀 **Planned:**
- Edit polygon vertices
- Automatic topology validation
- Multiple plot import wizard
- Plot comparison tool
- Area calculations for complex shapes
- 3D visualization of terrain

---

## Support & Resources

📍 **Geoportal:** https://geoportal.gov.pl  
📊 **TERYT Codes:** https://eteryt.stat.gov.pl  
🗺️ **GUGiK Data:** https://gugik.gov.pl  
📖 **EPSG:2180:** https://epsg.io/2180  

---

## Example Workflow: Planning on Irregular Plot

```
Step 1: Import L-shaped plot
→ Open New Project dialog
→ Name: "Renovation Project"
→ Enable "Importuj działkę"
→ Enter plot 162
→ Create project

Step 2: See actual boundaries
→ Gray polygon shows exact shape
→ Can plan around permanent features
→ Know exact area available

Step 3: Add buildings/elements
→ Drag & drop elements
→ They snap to grid
→ Respect actual plot boundaries
→ See exact dimensions

Step 4: Export & Share
→ Save project
→ Export as PNG/JSON
→ Share with surveyor/architect
→ Shows both boundaries and plan
```

This workflow ensures planning respects actual land geometry!
