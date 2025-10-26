export type SingBoxConfig = {
	log: {
		level: string
		timestamp: boolean
	}
	experimental: Object
	dns: Object
	inbounds: Object[]
	outbounds: Object[]
	route: Object
}
