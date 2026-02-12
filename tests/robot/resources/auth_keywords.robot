*** Settings ***
Documentation     Reusable keywords for authentication operations
Library           RequestsLibrary
Resource          api_keywords.robot
Resource          ../variables/config.robot

*** Keywords ***
Login As User
    [Documentation]    Login with regular user credentials and return token
    ${body}=           Create Dictionary    email=${TEST_USER_EMAIL}    password=${TEST_USER_PASSWORD}
    ${response}=       Send POST Request    ${LOGIN_ENDPOINT}    ${body}
    Verify Response Status    ${response}    200
    ${token}=          Extract JSON Value    ${response}    token
    [Return]           ${token}

Login As Admin
    [Documentation]    Login with admin credentials and return token
    ${body}=           Create Dictionary    email=${ADMIN_EMAIL}    password=${ADMIN_PASSWORD}
    ${response}=       Send POST Request    ${LOGIN_ENDPOINT}    ${body}
    Verify Response Status    ${response}    200
    ${token}=          Extract JSON Value    ${response}    token
    [Return]           ${token}

Login With Credentials
    [Documentation]    Login with provided credentials
    [Arguments]        ${email}    ${password}
    ${body}=           Create Dictionary    email=${email}    password=${password}
    ${response}=       Send POST Request    ${LOGIN_ENDPOINT}    ${body}
    [Return]           ${response}

Get Auth Token
    [Documentation]    Extract token from login response
    [Arguments]        ${response}
    ${token}=          Extract JSON Value    ${response}    token
    [Return]           ${token}

Logout User
    [Documentation]    Logout user with given token
    [Arguments]        ${token}
    ${headers}=        Create Authorization Header    ${token}
    ${response}=       Send POST Request    ${LOGOUT_ENDPOINT}    ${None}    ${headers}
    [Return]           ${response}

Verify Token Response
    [Documentation]    Verify login response has token and role
    [Arguments]        ${response}
    Verify Response Has Key    ${response}    token
    Verify Response Has Key    ${response}    role

Verify Admin Role
    [Documentation]    Verify response role is admin
    [Arguments]        ${response}
    ${role}=           Extract JSON Value    ${response}    role
    Should Be Equal    ${role}    admin

Verify User Role
    [Documentation]    Verify response role is user
    [Arguments]        ${response}
    ${role}=           Extract JSON Value    ${response}    role
    Should Be Equal    ${role}    user

Make Authenticated Request
    [Documentation]    Make GET request with authentication token
    [Arguments]        ${endpoint}    ${token}
    ${headers}=        Create Authorization Header    ${token}
    ${response}=       Send GET Request    ${endpoint}    ${headers}
    [Return]           ${response}

Verify Unauthorized Access
    [Documentation]    Verify request was rejected as unauthorized
    [Arguments]        ${response}
    Verify Response Status    ${response}    401

Verify Forbidden Access
    [Documentation]    Verify request was rejected as forbidden
    [Arguments]        ${response}
    Verify Response Status    ${response}    403
