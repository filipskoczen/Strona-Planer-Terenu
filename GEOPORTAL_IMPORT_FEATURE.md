# Geoportal Import Feature - Documentation

## Overview
This document describes the geoportal.gov.pl integration feature for importing land plot boundaries directly into the Land Planner application.

## Feature Specification

### User Flow
1. User creates or opens a project
2. User clicks the "Import" button (📋) in the toolbar
3. Modal dialog appears with form fields:
   - **Numer działki** (Plot Number): e.g., "001/2024"
   - **Wojewódzwo** (Voivodeship): 2-digit TERYT code (e.g., "12" for Mazovia)
   - **Powiat** (District): 2-digit TERYT code (e.g., "34")
   - **Gmina** (Commune): 2-digit TERYT code (e.g., "46")
4. User enters the required information
5. User clicks "Importuj" button
6. Application fetches plot boundaries from geoportal.gov.pl API
7. Plot boundary is displayed as a semi-transparent polygon on the canvas
8. Plot element is added to the layers list

### Technical Details

#### Element Type
- **Type**: `land_plot`
- **Shape**: `polygon`
- **Color**: #9ca3af (gray)
- **Opacity**: 0.4 (40%)
- **Locked**: No (can be edited)

#### Properties Stored
- `plotNumber`: Original plot identifier
- `area`: Plot area in square meters (if available from API)
- `coordinates`: Array of [x, y] coordinate pairs relative to element center
- `source`: "geoportal" (indicates data source)

#### Coordinate System
- **API Returns**: EPSG:2180 (Polish coordinate system)
- **Canvas Uses**: Pixel coordinates relative to element center
- **Conversion**: Uses `pixelsPerMeter` setting from project

### API Integration

#### Geoportal WFS Endpoint
```
https://wms.geoportal.gov.pl/wfs
```
Service: WFS (Web Feature Service)
Version: 2.0.0
Layer: EGiB:eGrid_Dzialki (Parcel layer)
Format: application/json
SRID: EPSG:2180

#### Query Parameters
- `service`: WFS
- `version`: 2.0.0
- `request`: GetFeature
- `typeNames`: EGiB:eGrid_Dzialki
- `outputFormat`: application/json
- `CQL_FILTER`: Property-based filtering

#### Alternative API
```
https://integracja.gugik.gov.pl/api/parcel/{TERYT}/{plotNumber}
```

### Error Handling
- Invalid plot number: Shows warning message
- Invalid TERYT codes: Shows validation error
- API unavailable: Falls back to example plot for testing
- No active project: Shows warning to create project first

### TERYT Code Reference
TERYT (Territorial Division Code) consists of 6 digits:
- First 2 digits: Voivodeship (województwo)
- Next 2 digits: District (powiat)
- Last 2 digits: Commune (gmina)

Common Voivodeships:
- 02 = Lower Silesia
- 04 = Lublin
- 06 = Łódź
- 08 = Masovian
- 10 = Opole
- 12 = Mazovia (Warsaw region)
- 14 = Pomerania
- 16 = Silesia
- 18 = Subcarpathia
- 20 = Warmia-Masuria
- 22 = Greater Poland
- 24 = Lesser Poland
- 26 = West Pomerania

Find TERYT codes at: https://eteryt.stat.gov.pl

## Files Modified

### New Files
- `js/manager/geoportalManager.js` - Main geoportal integration class

### Modified Files
- `index.html` - Added import button and modal dialog
- `css/styles.css` - Added form-description and form-info styles
- `js/manager/uiManager.js` - Added import modal handlers and methods
- `js/utils/constants.js` - Added land_plot element type and polygon shape
- `js/manager/canvasManager.js` - Added polygon shape rendering support
- `js/manager/elementFactory.js` - Enhanced to support shape property
- `js/app.js` - Made managers globally accessible

## Usage Examples

### Importing a Warsaw Plot
1. Create project with default settings
2. Click "Import" button
3. Enter:
   - Plot Number: "123/456"
   - Voivodeship: 12 (Mazovia)
   - District: 34
   - Commune: 46
4. Click "Importuj"
5. Plot boundary appears on canvas

### Editing Imported Plot
1. Select the plot element from layers list
2. In Properties panel, you can:
   - Change name
   - Modify size (width/height)
   - Change color (to distinguish from other plots)
   - Adjust opacity
   - Rotate if needed
   - View original plot number in properties

## Testing

### Test with Example Data
If geoportal API is unavailable, the feature will automatically use example plot data.
This allows testing without internet connectivity.

### Testing CORS Issues
If WFS requests fail due to CORS restrictions, consider:
- Using browser extensions that disable CORS checks (development only)
- Using a backend proxy server
- Contacting GUGiK for CORS configuration

## Future Enhancements
- Support for multiple plot imports in batch
- Caching of previously imported plots
- Integration with address search
- Support for other administrative divisions
- Street-level georeferencing
- Integration with satellite imagery layers

## Troubleshooting

### Plot not found
- Verify TERYT codes are correct at eteryt.stat.gov.pl
- Check plot number format
- Ensure codes are 2 digits each (pad with leading zero if needed)

### API timeouts
- Check internet connection
- Verify geoportal.gov.pl is accessible
- Try example plot mode

### Polygon not visible
- Check element opacity setting
- Verify element is in correct layer
- Ensure project zoom level shows the boundary

## References
- Geoportal: https://geoportal.gov.pl
- GUGiK: https://gugik.gov.pl
- TERYT Database: https://eteryt.stat.gov.pl
- WFS Specification: https://www.ogc.org/standards/wfs
