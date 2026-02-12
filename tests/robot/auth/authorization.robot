*** Settings ***
Documentation     BDD tests for role-based authorization
Library           RequestsLibrary
Resource          ../resources/auth_keywords.robot
Resource          ../resources/api_keywords.robot
Resource          ../variables/config.robot

Suite Setup       Create Session    api    ${BASE_URL}
Suite Teardown    Delete All Sessions

*** Test Cases ***
User Can Access User Dashboard
    [Documentation]    Regular user should access user-protected endpoint
    [Tags]    auth    authorization    positive
    Given A Logged In User
    When The User Accesses User Dashboard
    Then The User Should Receive User Data

Admin Can Access Admin Dashboard
    [Documentation]    Admin should access admin-protected endpoint
    [Tags]    auth    authorization    positive    admin
    Given A Logged In Admin
    When The Admin Accesses Admin Dashboard
    Then The Admin Should Receive Admin Data

User Cannot Access Admin Dashboard
    [Documentation]    Regular user should be forbidden from admin endpoint
    [Tags]    auth    authorization    negative
    Given A Logged In User
    When The User Attempts To Access Admin Dashboard
    Then The Request Should Be Forbidden

Request Without Token Is Unauthorized
    [Documentation]    Request without authentication token should fail
    [Tags]    auth    authorization    negative
    When Unauthenticated User Accesses Protected Endpoint
    Then The Request Should Be Unauthorized

*** Keywords ***
A Logged In User
    ${token}=          Login As User
    Set Test Variable    ${USER_TOKEN}    ${token}

A Logged In Admin
    ${token}=          Login As Admin
    Set Test Variable    ${ADMIN_TOKEN}    ${token}

The User Accesses User Dashboard
    ${response}=       Make Authenticated Request    ${DASHBOARD_ENDPOINT}    ${USER_TOKEN}
    Set Test Variable    ${RESPONSE}    ${response}

The Admin Accesses Admin Dashboard
    ${response}=       Make Authenticated Request    ${ADMIN_USERS_ENDPOINT}    ${ADMIN_TOKEN}
    Set Test Variable    ${RESPONSE}    ${response}

The User Attempts To Access Admin Dashboard
    ${response}=       Make Authenticated Request    ${ADMIN_USERS_ENDPOINT}    ${USER_TOKEN}
    Set Test Variable    ${RESPONSE}    ${response}

Unauthenticated User Accesses Protected Endpoint
    ${response}=       Send GET Request    ${ADMIN_USERS_ENDPOINT}
    Set Test Variable    ${RESPONSE}    ${response}

The User Should Receive User Data
    Verify Response Status    ${RESPONSE}    200
    Verify Response Contains    ${RESPONSE}    ${USER_MESSAGE}

The Admin Should Receive Admin Data
    Verify Response Status    ${RESPONSE}    200
    Verify Response Contains    ${RESPONSE}    ${ADMIN_MESSAGE}

The Request Should Be Forbidden
    Verify Forbidden Access    ${RESPONSE}

The Request Should Be Unauthorized
    Verify Unauthorized Access    ${RESPONSE}
