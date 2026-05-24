const MAP_CONFIG = {
    key: 'your-tencent-map-key',
    baseUrl: 'https://apis.map.qq.com/ws'
}

const reverseGeocoder = ({ latitude, longitude, get_poi = 1 }) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${MAP_CONFIG.baseUrl}/geocoder/v1/`,
            method: 'GET',
            data: {
                key: MAP_CONFIG.key,
                location: `${latitude},${longitude}`,
                get_poi: get_poi,
                poi_options: 'policy=2;radius=300;page_size=1;page_index=1'
            },
            success: (res) => {
                if (res.data.status === 0) {
                    resolve(res.data.result)
                } else {
                    reject(new Error(res.data.message || '逆地理编码失败'))
                }
            },
            fail: (err) => {
                console.error('Reverse geocoder failed:', err)
                reject(err)
            }
        })
    })
}

const getLocation = (type = 'gcj02') => {
    return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        wx.getLocation({
            type: type,
            success: (res) => {
                resolve({
                    latitude: res.latitude,
                    longitude: res.longitude,
                    speed: res.speed,
                    accuracy: res.accuracy
                })
            },
            fail: (err) => {
                console.error('Get location failed:', err)
                reject(err)
            }
        })
        // #endif

        // #ifndef MP-WEIXIN
        uni.getLocation({
            type: type,
            success: (res) => {
                resolve({
                    latitude: res.latitude,
                    longitude: res.longitude,
                    speed: res.speed,
                    accuracy: res.accuracy
                })
            },
            fail: (err) => {
                console.error('Get location failed:', err)
                reject(err)
            }
        })
        // #endif
    })
}

const getLocationAndReverseGeo = async () => {
    try {
        const location = await getLocation('gcj02')

        const geoResult = await reverseGeocoder({
            latitude: location.latitude,
            longitude: location.longitude
        })

        const addressComponent = geoResult.address_component
        const formattedAddresses = geoResult.formatted_addresses

        let province = addressComponent.province
        let city = addressComponent.city
        let district = addressComponent.district
        let street = addressComponent.street || ''
        let streetNumber = addressComponent.street_number || ''

        if (!city || city === province) {
            city = province
        }

        let detailedAddress = ''
        if (street) {
            detailedAddress = street
            if (streetNumber) {
                detailedAddress += streetNumber
            }
        }

        if (formattedAddresses && formattedAddresses.recommend) {
            const recommend = formattedAddresses.recommend
            const regionIndex = recommend.indexOf(district)
            if (regionIndex > -1) {
                detailedAddress = recommend.substring(regionIndex + district.length)
            } else {
                detailedAddress = recommend
            }
        }

        const poi = geoResult.pois && geoResult.pois[0]
        let poiName = ''
        if (poi) {
            poiName = poi.title
        }

        return {
            location,
            province,
            city,
            district,
            street,
            streetNumber,
            detailedAddress: detailedAddress.trim(),
            poiName,
            fullAddress: geoResult.address,
            raw: geoResult
        }
    } catch (error) {
        console.error('Get location and reverse geo failed:', error)
        throw error
    }
}

const calculateDistance = (from, to) => {
    const radLat1 = (from.latitude * Math.PI) / 180.0
    const radLat2 = (to.latitude * Math.PI) / 180.0
    const a = radLat1 - radLat2
    const b = (from.longitude * Math.PI) / 180.0 - (to.longitude * Math.PI) / 180.0

    let s = 2 * Math.asin(
        Math.sqrt(
            Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
        )
    )
    s = s * 6378137.0
    s = Math.round(s * 10000) / 10000

    return s
}

const formatDistance = (distance) => {
    if (distance < 1000) {
        return Math.round(distance) + 'm'
    } else {
        return (distance / 1000).toFixed(1) + 'km'
    }
}

export {
    MAP_CONFIG,
    getLocation,
    reverseGeocoder,
    getLocationAndReverseGeo,
    calculateDistance,
    formatDistance
}

export default {
    MAP_CONFIG,
    getLocation,
    reverseGeocoder,
    getLocationAndReverseGeo,
    calculateDistance,
    formatDistance
}
