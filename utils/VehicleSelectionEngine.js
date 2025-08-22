// utils/VehicleSelectionEngine.js
// Vehicle capability profiles with detailed criteria

export const VEHICLE_PROFILES = {
    bicycle: {
        name: "Bicycle",
        icon: "bicycle",
        emoji: "🚲",
        description: "Eco-friendly, best for short distances",
        capabilities: {
            maxWeight: 15, // kg
            maxDistance: 10, // km
            maxDimensions: { length: 50, width: 40, height: 30 }, // cm
            speedKmh: 15,
            costMultiplier: 0.6,
            weatherDependent: true,
            trafficAdvantage: true
        },
        restrictions: {
            fragileHandling: "limited", // limited, good, excellent
            specialHandling: false,
            securityLevel: "basic", // basic, standard, high
            storageType: ["open_basket", "insulated_bag"]
        },
        suitableFor: ["document", "food", "medicine", "small_parcel"],
        prioritySupport: ["instant", "normal"],
        timeWindows: {
            instant: { min: 15, max: 45 }, // minutes
            scheduled: { min: 30, max: 60 }
        }
    },

    motorcycle: {
        name: "Motorcycle",
        icon: "bicycle",
        emoji: "🏍️",
        description: "Fast and flexible for most deliveries",
        capabilities: {
            maxWeight: 50,
            maxDistance: 50,
            maxDimensions: { length: 80, width: 60, height: 50 },
            speedKmh: 35,
            costMultiplier: 1.0,
            weatherDependent: true,
            trafficAdvantage: true
        },
        restrictions: {
            fragileHandling: "good",
            specialHandling: true,
            securityLevel: "standard",
            storageType: ["delivery_box", "insulated_bag", "secure_compartment"]
        },
        suitableFor: ["document", "parcel", "food", "electronics", "clothing", "medicine", "books", "gifts"],
        prioritySupport: ["instant", "normal", "high"],
        timeWindows: {
            instant: { min: 10, max: 30 },
            scheduled: { min: 15, max: 45 }
        }
    },

    tricycle: {
        name: "Tricycle",
        icon: "bicycle",
        emoji: "🛺",
        description: "Stable transport for medium loads",
        capabilities: {
            maxWeight: 100,
            maxDistance: 30,
            maxDimensions: { length: 120, width: 80, height: 80 },
            speedKmh: 25,
            costMultiplier: 1.3,
            weatherDependent: false,
            trafficAdvantage: true
        },
        restrictions: {
            fragileHandling: "excellent",
            specialHandling: true,
            securityLevel: "standard",
            storageType: ["enclosed_cargo", "climate_controlled"]
        },
        suitableFor: ["parcel", "food", "electronics", "clothing", "furniture", "books", "gifts", "others"],
        prioritySupport: ["instant", "normal", "high"],
        timeWindows: {
            instant: { min: 15, max: 40 },
            scheduled: { min: 20, max: 60 }
        }
    },

    car: {
        name: "Car",
        icon: "car",
        emoji: "🚗",
        description: "Secure and comfortable for valuable items",
        capabilities: {
            maxWeight: 200,
            maxDistance: 100,
            maxDimensions: { length: 150, width: 100, height: 100 },
            speedKmh: 40,
            costMultiplier: 1.8,
            weatherDependent: false,
            trafficAdvantage: false
        },
        restrictions: {
            fragileHandling: "excellent",
            specialHandling: true,
            securityLevel: "high",
            storageType: ["enclosed_trunk", "climate_controlled", "secure_compartment"]
        },
        suitableFor: ["parcel", "electronics", "clothing", "furniture", "jewelry", "gifts", "books", "others"],
        prioritySupport: ["normal", "high", "urgent"],
        timeWindows: {
            instant: { min: 20, max: 50 },
            scheduled: { min: 30, max: 90 }
        }
    },

    van: {
        name: "Van",
        icon: "car",
        emoji: "🚐",
        description: "Large capacity for bulk deliveries",
        capabilities: {
            maxWeight: 500,
            maxDistance: 150,
            maxDimensions: { length: 200, width: 150, height: 150 },
            speedKmh: 35,
            costMultiplier: 2.5,
            weatherDependent: false,
            trafficAdvantage: false
        },
        restrictions: {
            fragileHandling: "excellent",
            specialHandling: true,
            securityLevel: "high",
            storageType: ["large_cargo_area", "climate_controlled", "secure_compartment"]
        },
        suitableFor: ["furniture", "electronics", "clothing", "others", "parcel"],
        prioritySupport: ["scheduled", "normal", "high"],
        timeWindows: {
            scheduled: { min: 45, max: 120 }
        }
    },

    truck: {
        name: "Truck",
        icon: "car",
        emoji: "🚛",
        description: "Heavy duty for large furniture & appliances",
        capabilities: {
            maxWeight: 2000,
            maxDistance: 200,
            maxDimensions: { length: 300, width: 200, height: 200 },
            speedKmh: 30,
            costMultiplier: 4.0,
            weatherDependent: false,
            trafficAdvantage: false
        },
        restrictions: {
            fragileHandling: "excellent",
            specialHandling: true,
            securityLevel: "high",
            storageType: ["large_cargo_area", "hydraulic_lift"]
        },
        suitableFor: ["furniture", "others"],
        prioritySupport: ["scheduled"],
        timeWindows: {
            scheduled: { min: 60, max: 180 }
        }
    }
};

// Core evaluation engine
export class VehicleSelectionEngine {
    constructor(orderData) {
        this.order = orderData;
        this.distance = this.calculateDistance();
        this.packageWeight = this.getPackageWeight();
        this.packageDimensions = this.getPackageDimensions();
    }

    calculateDistance() {
        // Calculate distance from pickup to dropoff coordinates
        const pickup = this.order.location?.pickUp?.coordinates?.coordinates;
        const dropoff = this.order.location?.dropOff?.coordinates?.coordinates;

        if (!pickup || !dropoff || pickup.length !== 2 || dropoff.length !== 2) {
            return 0; // Default if coordinates missing
        }

        return this.haversineDistance(
            pickup[1], pickup[0], // lat, lng
            dropoff[1], dropoff[0]
        );
    }

    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(deg) {
        return deg * (Math.PI/180);
    }

    getPackageWeight() {
        const weight = this.order.package?.weight;
        if (!weight?.value) return 0;

        // Convert to kg
        return weight.unit === 'g' ? weight.value / 1000 : weight.value;
    }

    getPackageDimensions() {
        const dim = this.order.package?.dimensions;
        if (!dim?.length || !dim?.width || !dim?.height) {
            return { length: 0, width: 0, height: 0 };
        }

        // Convert to cm
        const multiplier = dim.unit === 'inch' ? 2.54 : 1;
        return {
            length: dim.length * multiplier,
            width: dim.width * multiplier,
            height: dim.height * multiplier
        };
    }

    evaluateVehicle(vehicleType) {
        const profile = VEHICLE_PROFILES[vehicleType];
        if (!profile) return { status: 'disabled', reason: 'Unknown vehicle type' };

        const evaluation = {
            status: 'allowed', // recommended, allowed, disabled
            reason: '',
            score: 0,
            details: {
                distance: this.evaluateDistance(profile),
                weight: this.evaluateWeight(profile),
                dimensions: this.evaluateDimensions(profile),
                category: this.evaluateCategory(profile),
                priority: this.evaluatePriority(profile),
                fragile: this.evaluateFragile(profile),
                specialHandling: this.evaluateSpecialHandling(profile)
            },
            estimatedCost: this.calculateCost(profile),
            estimatedTime: this.calculateTime(profile)
        };

        // Aggregate evaluation
        const failed = Object.values(evaluation.details).find(detail => detail.status === 'disabled');
        if (failed) {
            evaluation.status = 'disabled';
            evaluation.reason = failed.reason;
            return evaluation;
        }

        // Calculate composite score
        const scores = Object.values(evaluation.details).map(d => d.score);
        evaluation.score = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Determine recommendation level
        if (evaluation.score >= 85) {
            evaluation.status = 'recommended';
        } else if (evaluation.score >= 60) {
            evaluation.status = 'allowed';
        } else {
            evaluation.status = 'disabled';
            evaluation.reason = 'Overall compatibility too low';
        }

        return evaluation;
    }

    evaluateDistance(profile) {
        if (this.distance > profile.capabilities.maxDistance) {
            return {
                status: 'disabled',
                reason: `Distance ${this.distance.toFixed(1)}km exceeds maximum ${profile.capabilities.maxDistance}km`,
                score: 0
            };
        }

        const efficiency = Math.max(0, 100 - (this.distance / profile.capabilities.maxDistance) * 50);
        return {
            status: 'allowed',
            reason: `Distance: ${this.distance.toFixed(1)}km`,
            score: efficiency
        };
    }

    evaluateWeight(profile) {
        if (this.packageWeight > profile.capabilities.maxWeight) {
            return {
                status: 'disabled',
                reason: `Weight ${this.packageWeight}kg exceeds maximum ${profile.capabilities.maxWeight}kg`,
                score: 0
            };
        }

        const efficiency = Math.max(0, 100 - (this.packageWeight / profile.capabilities.maxWeight) * 30);
        return {
            status: 'allowed',
            reason: `Weight: ${this.packageWeight}kg`,
            score: efficiency
        };
    }

    evaluateDimensions(profile) {
        const { length, width, height } = this.packageDimensions;
        const maxDim = profile.capabilities.maxDimensions;

        if (length > maxDim.length || width > maxDim.width || height > maxDim.height) {
            return {
                status: 'disabled',
                reason: `Dimensions exceed limits (${length}×${width}×${height}cm vs ${maxDim.length}×${maxDim.width}×${maxDim.height}cm)`,
                score: 0
            };
        }

        const utilization = Math.max(
            length / maxDim.length,
            width / maxDim.width,
            height / maxDim.height
        );
        const efficiency = Math.max(0, 100 - utilization * 20);

        return {
            status: 'allowed',
            reason: `Dimensions: ${length}×${width}×${height}cm`,
            score: efficiency
        };
    }

    evaluateCategory(profile) {
        const category = this.order.package?.category;
        if (!category) return { status: 'allowed', reason: 'No category specified', score: 70 };

        if (profile.suitableFor.includes(category)) {
            return {
                status: 'allowed',
                reason: `Perfect for ${category} deliveries`,
                score: 100
            };
        }

        return {
            status: 'allowed',
            reason: `Can handle ${category} deliveries`,
            score: 60
        };
    }

    evaluatePriority(profile) {
        const priority = this.order.priority || 'normal';
        const orderType = this.order.orderType || 'instant';

        if (!profile.prioritySupport.includes(priority)) {
            return {
                status: 'disabled',
                reason: `Does not support ${priority} priority orders`,
                score: 0
            };
        }

        if (!profile.timeWindows[orderType]) {
            return {
                status: 'disabled',
                reason: `Does not support ${orderType} orders`,
                score: 0
            };
        }

        return {
            status: 'allowed',
            reason: `Supports ${priority} priority ${orderType} orders`,
            score: 90
        };
    }

    evaluateFragile(profile) {
        const isFragile = this.order.package?.isFragile;
        if (!isFragile) return { status: 'allowed', reason: 'Not fragile', score: 100 };

        const handlingLevel = profile.restrictions.fragileHandling;
        if (handlingLevel === 'limited') {
            return {
                status: 'allowed',
                reason: 'Limited fragile handling capability',
                score: 40
            };
        } else if (handlingLevel === 'good') {
            return {
                status: 'allowed',
                reason: 'Good fragile handling',
                score: 80
            };
        } else {
            return {
                status: 'allowed',
                reason: 'Excellent fragile handling',
                score: 100
            };
        }
    }

    evaluateSpecialHandling(profile) {
        const needsSpecial = this.order.package?.requiresSpecialHandling;
        if (!needsSpecial) return { status: 'allowed', reason: 'No special handling needed', score: 100 };

        if (!profile.restrictions.specialHandling) {
            return {
                status: 'disabled',
                reason: 'Cannot provide special handling',
                score: 0
            };
        }

        return {
            status: 'allowed',
            reason: 'Can provide special handling',
            score: 90
        };
    }

    calculateCost(profile) {
        const baseCost = 1000; // Base cost in NGN
        const distanceCost = this.distance * 50;
        const weightCost = this.packageWeight * 20;
        const priorityCost = this.order.priority === 'urgent' ? 500 : 0;

        return Math.round(
            (baseCost + distanceCost + weightCost + priorityCost) * profile.capabilities.costMultiplier
        );
    }

    calculateTime(profile) {
        const orderType = this.order.orderType || 'instant';
        const timeWindow = profile.timeWindows[orderType];

        if (!timeWindow) return null;

        const baseTime = this.distance / profile.capabilities.speedKmh * 60; // minutes
        const totalTime = Math.max(timeWindow.min, Math.min(timeWindow.max, baseTime + 10));

        return Math.round(totalTime);
    }

    getAllEvaluations() {
        const vehicleTypes = Object.keys(VEHICLE_PROFILES);
        const evaluations = {};

        vehicleTypes.forEach(type => {
            evaluations[type] = this.evaluateVehicle(type);
        });

        // Sort by status and score
        const sortedTypes = vehicleTypes.sort((a, b) => {
            const evalA = evaluations[a];
            const evalB = evaluations[b];

            if (evalA.status === evalB.status) {
                return evalB.score - evalA.score; // Higher score first
            }

            const statusOrder = { 'recommended': 0, 'allowed': 1, 'disabled': 2 };
            return statusOrder[evalA.status] - statusOrder[evalB.status];
        });

        return {
            evaluations,
            sortedTypes,
            recommended: sortedTypes.filter(type => evaluations[type].status === 'recommended'),
            allowed: sortedTypes.filter(type => evaluations[type].status === 'allowed'),
            disabled: sortedTypes.filter(type => evaluations[type].status === 'disabled')
        };
    }
}