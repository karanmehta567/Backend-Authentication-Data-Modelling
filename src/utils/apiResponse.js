class ApiResponse {
    constructor(
        statusCode,
        data,
        message = 'Good to go'
    ) {
        this.data = data
        this.message = message
        this.statusCode = statusCode
        this.success = statusCode < 400
    }
}
export { ApiResponse }