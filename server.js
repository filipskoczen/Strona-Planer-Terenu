/**
 * CORS Proxy Server for Geoportal API
 * Handles requests to GUGiK/Geoportal and returns real parcel data
 * Usage: node server.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

/**
 * Return mocked parcel data for known parcels
 * Allows testing without real Geoportal API access
 */
function getMockedParcelData(teryt, plotNumber) {
    // For testing - we can add known parcels here
    // In production, all requests would go to real WFS API
    
    // For now, return null to force WFS query
    return null;
}

// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * Main proxy endpoint for Geoportal WFS queries
 */
app.get('/api/parcel', async (req, res) => {
    try {
        const { teryt, plot } = req.query;
        
        if (!teryt || !plot) {
            return res.status(400).json({ error: 'Missing teryt or plot parameter' });
        }

        console.log(`📍 Querying parcel: TERYT=${teryt}, Plot=${plot}`);

        // Use GUGiK WFS endpoint to get parcel data
        const wfsUrl = `https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracja`;
        
        const params = {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeNames: 'EGiB:EGiB_Dzialka', // Parcel layer
            outputFormat: 'application/json',
            CQL_FILTER: `(gml_id LIKE 'EGiB_Dzialka.%')`,
            srsname: 'EPSG:2180'
        };

        console.log('🔗 Fetching from GUGiK WFS:', wfsUrl);
        
        const response = await axios.get(wfsUrl, { 
            params,
            timeout: 10000 
        });

        const features = response.data.features || [];
        
        if (features.length === 0) {
            console.warn('⚠️ No features found, trying alternative endpoint...');
            return await queryIntegrattaAPI(teryt, plot, res);
        }

        console.log(`✅ Found ${features.length} parcels`);
        
        // Filter by TERYT and plot number
        const filtered = features.filter(f => {
            const props = f.properties || {};
            const nr_dzialki = String(props.nr_dzialki || '').trim();
            const voivode = String(props.woj_kod || '').pad(2, '0');
            const county = String(props.pow_kod || '').padStart(2, '0');
            const municipality = String(props.gmi_kod || '').padStart(2, '0');
            
            const terytCode = `${voivode}${county}${municipality}`;
            
            return terytCode === teryt && nr_dzialki === plot;
        });

        if (filtered.length > 0) {
            return res.json(filtered[0]);
        }

        // Fallback to alternative API
        await queryIntegrattaAPI(teryt, plot, res);

    } catch (error) {
        console.error('❌ Error querying WFS:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch parcel data',
            details: error.message 
        });
    }
});

/**
 * Alternative endpoint using public Integracja API
 */
async function queryIntegrattaAPI(teryt, plot, res) {
    try {
        const url = `https://integracja.gugik.gov.pl/parcel/${teryt}/${plot}`;
        console.log(`🔗 Trying alternative endpoint: ${url}`);

        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.geometry) {
            console.log('✅ Got parcel from alternative API');
            return res.json({
                type: 'Feature',
                properties: response.data.properties || {
                    nr_dzialki: plot,
                    pole_pow: response.data.properties?.pole_pow || 0
                },
                geometry: response.data.geometry
            });
        }

        return res.status(404).json({ error: 'Parcel not found' });

    } catch (error) {
        console.error('❌ Alternative API failed:', error.message);
        return res.status(500).json({ error: 'All APIs failed' });
    }
}

/**
 * Advanced search endpoint for finding parcels
 */
app.post('/api/search', async (req, res) => {
    try {
        const { voivodeship, district, commune, plotNumber } = req.body;

        if (!voivodeship || !district || !commune || !plotNumber) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { voivodeship, district, commune, plotNumber }
            });
        }

        const teryt = `${voivodeship}${district}${commune}`;
        console.log(`🔍 Searching for plot: TERYT=${teryt}, plotNumber=${plotNumber}`);

        // Try to get from GUGiK WFS API
        try {
            const wfsUrl = 'https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracja';
            const params = {
                service: 'WFS',
                version: '2.0.0',
                request: 'GetFeature',
                typeNames: 'EGiB:EGiB_Dzialka',
                outputFormat: 'application/json',
                CQL_FILTER: `(je_sop_kod='${teryt}' AND nr_dzialki='${plotNumber}')`,
                srsname: 'EPSG:2180',
                maxFeatures: 1
            };

            console.log(`📡 Querying GUGiK WFS API with timeout 10s...`);
            console.log(`   URL: ${wfsUrl}`);
            console.log(`   Filter: ${params.CQL_FILTER}`);
            
            const wfsResponse = await axios.get(wfsUrl, { 
                params, 
                timeout: 10000,
                validateStatus: () => true // Accept all status codes
            });
            
            console.log(`   Response status: ${wfsResponse.status}`);
            console.log(`   Response data keys: ${Object.keys(wfsResponse.data).join(', ')}`);
            
            if (wfsResponse.status !== 200) {
                console.warn(`⚠️ WFS returned status ${wfsResponse.status}`);
            }
            
            if (wfsResponse.data.features && wfsResponse.data.features.length > 0) {
                const feature = wfsResponse.data.features[0];
                console.log(`✅ Got feature! Geometry type: ${feature.geometry?.type}`);
                if (feature.geometry) {
                    const vertexCount = feature.geometry.coordinates[0]?.length - 1 || 0;
                    console.log(`📐 Real geometry with ${vertexCount} vertices!`);
                    return res.json(feature);
                }
            } else {
                console.warn(`⚠️ WFS returned 0 features. Response:`, JSON.stringify(wfsResponse.data).substring(0, 200));
            }
        } catch (wfsError) {
            console.error(`❌ WFS query threw error: ${wfsError.message}`);
            if (wfsError.code === 'ECONNABORTED') {
                console.error(`   → Timeout (10s exceeded)`);
            }
            console.error(`   → Stack:`, wfsError.stack?.substring(0, 200));
        }

        res.status(404).json({ 
            error: 'Parcel not found',
            hint: 'Try checking TERYT and plot number'
        });

    } catch (error) {
        console.error('❌ Search failed:', error.message);
        res.status(500).json({ 
            error: 'Search failed',
            details: error.message 
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Geoportal Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET  /api/parcel?teryt=VVPPGG&plot=NNN`);
    console.log(`   POST /api/search`);
    console.log(`   GET  /api/health\n`);
});

module.exports = app;
