const analyticsService = require('./analytics.service');

async function getBrandAnalytics(request, reply) {
    try {
        const { period = '7d' } = request.query;

        const organizationId =
            request.userContext.organization_id;

        if (!organizationId) {
            return reply.status(400).send({
                success: false,
                message: 'Organization not found'
            });
        }

        const data =
            await analyticsService.getBrandAnalytics(
                organizationId,
                period
            );

        return reply.send({
            success: true,
            data
        });

    } catch (error) {
        console.error(
            'ANALYTICS V3 ERROR:',
            error
        );

        return reply.status(500).send({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
}

module.exports = {
    getBrandAnalytics
};