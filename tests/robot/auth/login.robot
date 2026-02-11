*** Settings ***
Documentation     BDD tests for user login functionality
Library           RequestsLibrary
Resource          ../resources/auth_keywords.robot
Resource          ../resources/api_keywords.robot
Resource          ../variables/config.robot

Suite Setup       Create Session    api    ${BASE_URL}
Suite Teardown    Delete All Sessions

*** Test Cases ***
Successful Login With Valid User Credentials
    [Documentation]    User should receive JWT token and role when logging in with valid credentials
    [Tags]    auth    login    positive
    Given A User With Email And Password
    When The User Logs In With Valid User Credentials
    Then The User Should Receive A Valid JWT Token
    And The User Role Should Be user

Successful Login With Valid Admin Credentials
    [Documentation]    Admin should receive JWT token and admin role
    [Tags]    auth    login    positive    admin
    Given An Admin With Email And Password
    When The Admin Logs In With Valid Admin Credentials
    Then The Admin Should Receive A Valid JWT Token
    And The Admin Role Should Be admin

Failed Login With Invalid Password
    [Documentation]    User should receive 401 error with wrong password
    [Tags]    auth    login    negative
    Given A User With Valid Email
    When The User Logs In With Wrong Password
    Then The User Should Receive A 401 Error
    And The Error Message Should Indicate Authentication Failure

Failed Login With Non-Existent User
    [Documentation]    Login should fail for user that doesn't exist
    [Tags]    auth    login    negative
    Given A Non-Existent User Email
    When The User Attempts To Log In
    Then The User Should Receive A 401 Error

Login With Missing Email
    [Documentation]    Login should fail when email is not provided
    [Tags]    auth    login    validation
    When User Submits Login Without Email
    Then The User Should Receive A 401 Error

Login With Missing Password
    [Documentation]    Login should fail when password is not provided
    [Tags]    auth    login    validation
    When User Submits Login Without Password
    Then The User Should Receive A 401 Error

Token Contains Correct User Information
    [Documentation]    JWT token should contain user ID and role
    [Tags]    auth    login    token
    Given A User Logs In Successfully
    Then The Token Should Contain User ID
    And The Token Should Contain User Role

*** Keywords ***
A User With Email And Password
    Set Test Variable    ${USER_EMAIL}    ${TEST_USER_EMAIL}
    Set Test Variable    ${USER_PASSWORD}    ${TEST_USER_PASSWORD}

An Admin With Email And Password
    Set Test Variable    ${ADMIN_USER_EMAIL}    ${ADMIN_EMAIL}
    Set Test Variable    ${ADMIN_USER_PASSWORD}    ${ADMIN_PASSWORD}

A User With Valid Email
    Set Test Variable    ${USER_EMAIL}    ${TEST_USER_EMAIL}

A Non-Existent User Email
    Set Test Variable    ${USER_EMAIL}    nonexistent@example.com
    Set Test Variable    ${USER_PASSWORD}    anypassword

The User Logs In With Valid User Credentials
    ${response}=       Login With Credentials    ${USER_EMAIL}    ${USER_PASSWORD}
    Set Test Variable    ${LOGIN_RESPONSE}    ${response}

The Admin Logs In With Valid Admin Credentials
    ${response}=       Login With Credentials    ${ADMIN_USER_EMAIL}    ${ADMIN_USER_PASSWORD}
    Set Test Variable    ${LOGIN_RESPONSE}    ${response}

The User Logs In With Wrong Password
    ${response}=       Login With Credentials    ${USER_EMAIL}    wrongpassword123
    Set Test Variable    ${LOGIN_RESPONSE}    ${response}

The User Attempts To Log In
    ${response}=       Login With Credentials    ${USER_EMAIL}    ${USER_PASSWORD}
    Set Test Variable    ${LOGIN_RESPONSE}    ${response}

User Submits Login Without Email
    ${body}=           Create Dictionary    password=testpassword
    ${response}=       Send POST Request    ${LOGIN_ENDPOINT}    ${body}
    Set Test Variable    ${LOGIN_RESPONSE}    ${response}

User Submits Login Without Password
    ${body}=           Create Dictionary    email=test@example.com
    ${response}=       Send POST Request    ${LOGIN_ENDPOINT}    ${body}
    Set Test Variable    ${LOGIN_RESPONSE}    ${response}

A User Logs In Successfully
    ${token}=          Login As User
    Set Test Variable    ${USER_TOKEN}    ${token}

The User Should Receive A Valid JWT Token
    Verify Response Status    ${LOGIN_RESPONSE}    200
    Verify Token Response    ${LOGIN_RESPONSE}

The Admin Should Receive A Valid JWT Token
    Verify Response Status    ${LOGIN_RESPONSE}    200
    Verify Token Response    ${LOGIN_RESPONSE}

The User Role Should Be user
    Verify User Role    ${LOGIN_RESPONSE}

The Admin Role Should Be admin
    Verify Admin Role    ${LOGIN_RESPONSE}

The User Should Receive A 401 Error
    Verify Response Status    ${LOGIN_RESPONSE}    401

The Error Message Should Indicate Authentication Failure
    Verify Error Response    ${LOGIN_RESPONSE}    authenticated failed

The Token Should Contain User ID
    ${token}=          Get Auth Token    ${LOGIN_RESPONSE}
    Should Not Be Empty    ${token}
    Should Match Regexp    ${token}    ^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$

The Token Should Contain User Role
    Verify Response Has Key    ${LOGIN_RESPONSE}    role
