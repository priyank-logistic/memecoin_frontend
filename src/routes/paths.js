const subRoute = (root, sub) => `${root}${sub}`
const SUPER_ADMIN = "/super-admin"

export const PATH_DASHBOARD = {
    superAdmin: {
        root: SUPER_ADMIN,
        rolePermission: subRoute(SUPER_ADMIN, "/role-permission"),
        inquiryManagement: subRoute(SUPER_ADMIN, "/inquiry-management"),
        fleetVehicle: subRoute(SUPER_ADMIN, "/fleet-vehicle-management"),

        //   vendorManagement: subRoute(SUPER_ADMIN, "/vendor-management"),
        //   driverManagement: subRoute(SUPER_ADMIN, "/driver-management"),
        //   clientManagement: subRoute(SUPER_ADMIN, "/client-management"),
        //   bookingOperations: subRoute(SUPER_ADMIN, "/booking-operations"),
        //   serviceMaintenance: subRoute(SUPER_ADMIN, "/service-maintenance"),
        //   financialManagement: subRoute(SUPER_ADMIN, "/financial-management"),
        //   inventoryManagement: subRoute(SUPER_ADMIN, "/inventory-management"),
        //   reportsAnalytics: subRoute(SUPER_ADMIN, "/reports-analytics"),
    }
}
