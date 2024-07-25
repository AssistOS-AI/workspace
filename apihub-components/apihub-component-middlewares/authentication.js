const cookie = require('../apihub-component-utils/cookie.js');
const jwt = require('../apihub-component-utils/jwt.js');
const utils = require('../apihub-component-utils/utils.js');
const config = require('../config.json');
const User = require('../users-storage/user.js');
const crypto = require('crypto');

const dbName = "AuthSessionMDB";
const tableName = "UsersActiveSessions";
const enclave = require("opendsu").loadAPI("enclave");

async function authentication(req, res, next) {
    const cookies = cookie.parseCookies(req);
    const authToken = cookies['authToken'];
    const refreshToken = cookies['refreshAuthToken'];
    let setCookies = [];

    if (authToken) {
        try {
            const { userId, verificationKey } = await jwt.validateUserAccessJWT(authToken, 'AccessToken');
            const accountSessionData = await $$.promisify($$.ActiveSessionsClient.getRecord)($$.SYSTEM_IDENTIFIER, tableName, userId);

            if (accountSessionData.data.verificationKey === verificationKey) {
                req.userId = userId;
                return next();
            } else {
                return authenticationError(res, next);
            }
        } catch (error) {
            // invalid token, ignore error and attempt to generate a new authToken
        }
    }

    if (refreshToken) {
        try {
            const { userId, verificationKey } = await jwt.validateUserAccessJWT(refreshToken, 'RefreshToken');
            const accountSessionData = await $$.promisify($$.ActiveSessionsClient.getRecord)($$.SYSTEM_IDENTIFIER, tableName, userId);

            if (accountSessionData.data.verificationKey === verificationKey) {
                const userData = await User.APIs.getUserData(userId);
                const newVerificationKey = crypto.randomBytes(16).toString('hex');
                const newAuthCookie = await cookie.createAuthCookie(userData, newVerificationKey);
                setCookies.push(newAuthCookie);
                await $$.promisify($$.ActiveSessionsClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableName, userId, { data: { verificationKey: newVerificationKey } });
                req.userId = userId;
                res.setHeader('Set-Cookie', setCookies);
                return next();
            } else {
                return authenticationError(res, next);
            }
        } catch (error) {
            res.setHeader('Set-Cookie', setCookies);
            return authenticationError(res, next);
        }
    } else {
        res.setHeader('Set-Cookie', setCookies);
        return authenticationError(res, next);
    }
}

function authenticationError(res, next) {
    const error = new Error('Authentication failed');
    error.statusCode = 401;
    if (config.CREATE_DEMO_USER === 'true') {
        const { email, password } = User.templates.demoUser;
        utils.sendResponse(res, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        }, [cookie.createDemoUserCookie(email, password), cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } else {
        utils.sendResponse(res, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        }, [cookie.deleteDemoUserCookie(), cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    }
    next(error);
}

module.exports = authentication;
