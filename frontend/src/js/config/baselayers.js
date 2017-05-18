module.exports = {
    defaultOption: 'classic',
    options: {
        'classic': {
            "name": "Classic",
            "url": "https://tile.gbif.org/3857/omt/{Z}/{X}/{Y}@1x.png?style=gbif-classic",
            "attribution": "© <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": true
        },
        'dark': {
            "name": "Night",
            "url": "https://tile.gbif.org/3857/omt/{Z}/{X}/{Y}@1x.png?style=gbif-dark",
            "attribution": "© <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "saturation=true",
            "subdomains": [],
            "enabled": false
        },
        'ocean': {
            "name": "Terrain",
            "url": "http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{Z}/{Y}/{X}.png",
            "attribution": "Esri, DeLorme, FAO, USGS, NOAA, GEBCO, IHO-IOC GEBCO, NGS, NIWA",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": false
        },
        'satellite': {
            "name": "Satellite",
            "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}.png",
            "attribution": "Esri, DeLorme, FAO, NOAA, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": false
        },
        'light': {
            "name": "High contrast",
            "url": "https://tile.gbif.org/3857/omt/{Z}/{X}/{Y}@1x.png?style=gbif-light",
            "attribution": "© <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "colors=%2C%2C%23CC0000FF",
            "subdomains": [],
            "enabled": false
        },
        'grey-blue': {
            "name": "Roads",
            "url": "https://tile.gbif.org/3857/omt/{Z}/{X}/{Y}@1x.png?style=osm-bright",
            "attribution": "© <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": false
        }
    }
};
