export namespace config {
	
	export class Config {
	    dataFilePath: string;
	    passwordHash: string;
	    autoRefreshIntervalSec: number;
	    editSessionTimeoutMin: number;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dataFilePath = source["dataFilePath"];
	        this.passwordHash = source["passwordHash"];
	        this.autoRefreshIntervalSec = source["autoRefreshIntervalSec"];
	        this.editSessionTimeoutMin = source["editSessionTimeoutMin"];
	    }
	}

}

export namespace models {
	
	export class Building {
	    name: string;
	    floors: number[];
	
	    static createFrom(source: any = {}) {
	        return new Building(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.floors = source["floors"];
	    }
	}
	export class CommonFields {
	    manufacturer: string;
	    model: string;
	    serialNumber: string;
	
	    static createFrom(source: any = {}) {
	        return new CommonFields(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.manufacturer = source["manufacturer"];
	        this.model = source["model"];
	        this.serialNumber = source["serialNumber"];
	    }
	}
	export class Component {
	    id: string;
	    type: string;
	    name: string;
	    inventoryNumber?: string;
	    serialNumber?: string;
	    specifications?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new Component(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.name = source["name"];
	        this.inventoryNumber = source["inventoryNumber"];
	        this.serialNumber = source["serialNumber"];
	        this.specifications = source["specifications"];
	    }
	}
	export class License {
	    id: string;
	    softwareName: string;
	    licenseKey: string;
	    licenseType: string;
	    userId: string;
	    purchaseDate?: string;
	    expirationDate?: string;
	    quantity: number;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new License(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.softwareName = source["softwareName"];
	        this.licenseKey = source["licenseKey"];
	        this.licenseType = source["licenseType"];
	        this.userId = source["userId"];
	        this.purchaseDate = source["purchaseDate"];
	        this.expirationDate = source["expirationDate"];
	        this.quantity = source["quantity"];
	        this.notes = source["notes"];
	    }
	}
	export class Equipment {
	    id: string;
	    type: string;
	    inventoryNumber: string;
	    responsibleUserId: string;
	    roomId: string;
	    commissionDate: string;
	    notes: string;
	    commonFields: CommonFields;
	    specificFields: Record<string, any>;
	    components: Component[];
	
	    static createFrom(source: any = {}) {
	        return new Equipment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.inventoryNumber = source["inventoryNumber"];
	        this.responsibleUserId = source["responsibleUserId"];
	        this.roomId = source["roomId"];
	        this.commissionDate = source["commissionDate"];
	        this.notes = source["notes"];
	        this.commonFields = this.convertValues(source["commonFields"], CommonFields);
	        this.specificFields = source["specificFields"];
	        this.components = this.convertValues(source["components"], Component);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FloorPlanRoom {
	    roomId: string;
	    shape: string;
	    x: number;
	    y: number;
	    width: number;
	    height: number;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new FloorPlanRoom(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.roomId = source["roomId"];
	        this.shape = source["shape"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.color = source["color"];
	    }
	}
	export class FloorPlan {
	    floor: number;
	    width: number;
	    height: number;
	    rooms: FloorPlanRoom[];
	
	    static createFrom(source: any = {}) {
	        return new FloorPlan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.floor = source["floor"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.rooms = this.convertValues(source["rooms"], FloorPlanRoom);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Room {
	    id: string;
	    floor: number;
	    number: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Room(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.floor = source["floor"];
	        this.number = source["number"];
	        this.name = source["name"];
	    }
	}
	export class ResponsibleUser {
	    id: string;
	    lastName: string;
	    firstName: string;
	    patronymic: string;
	    departmentId: string;
	
	    static createFrom(source: any = {}) {
	        return new ResponsibleUser(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.lastName = source["lastName"];
	        this.firstName = source["firstName"];
	        this.patronymic = source["patronymic"];
	        this.departmentId = source["departmentId"];
	    }
	}
	export class Department {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Department(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class DataStore {
	    version: number;
	    lastModified: string;
	    modifiedBy: string;
	    building: Building;
	    departments: Department[];
	    responsibleUsers: ResponsibleUser[];
	    rooms: Room[];
	    floorPlans: FloorPlan[];
	    equipment: Equipment[];
	    licenses: License[];
	
	    static createFrom(source: any = {}) {
	        return new DataStore(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.lastModified = source["lastModified"];
	        this.modifiedBy = source["modifiedBy"];
	        this.building = this.convertValues(source["building"], Building);
	        this.departments = this.convertValues(source["departments"], Department);
	        this.responsibleUsers = this.convertValues(source["responsibleUsers"], ResponsibleUser);
	        this.rooms = this.convertValues(source["rooms"], Room);
	        this.floorPlans = this.convertValues(source["floorPlans"], FloorPlan);
	        this.equipment = this.convertValues(source["equipment"], Equipment);
	        this.licenses = this.convertValues(source["licenses"], License);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	

}

