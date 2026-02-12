*** Settings ***
Documentation     Reusable keywords for API interactions
Library           RequestsLibrary
Library           Collections
Library           String

*** Keywords ***
Send POST Request
    [Documentation]    Send POST request with JSON body
    [Arguments]        ${endpoint}    ${body}    ${headers}=${None}
    ${response}=       POST           ${endpoint}    json=${body}    headers=${headers}    expected_status=any
    [Return]           ${response}

Send GET Request
    [Documentation]    Send GET request
    [Arguments]        ${endpoint}    ${headers}=${None}
    ${response}=       GET            ${endpoint}    headers=${headers}    expected_status=any
    [Return]           ${response}

Send DELETE Request
    [Documentation]    Send DELETE request
    [Arguments]        ${endpoint}    ${headers}=${None}
    ${response}=       DELETE         ${endpoint}    headers=${headers}    expected_status=any
    [Return]           ${response}

Verify Response Status
    [Documentation]    Verify HTTP status code
    [Arguments]        ${response}    ${expected_status}
    Should Be Equal As Numbers    ${response.status_code}    ${expected_status}

Verify Response Contains
    [Documentation]    Verify response body contains text
    [Arguments]        ${response}    ${expected_text}
    ${response_text}=  Convert To String    ${response.json()}
    Should Contain     ${response_text}    ${expected_text}

Verify Response Has Key
    [Documentation]    Verify response JSON has specific key
    [Arguments]        ${response}    ${key}
    ${json}=           Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    ${key}

Extract JSON Value
    [Documentation]    Extract value from JSON response
    [Arguments]        ${response}    ${key}
    ${json}=           Set Variable    ${response.json()}
    ${value}=          Get From Dictionary    ${json}    ${key}
    [Return]           ${value}

Create Authorization Header
    [Documentation]    Create Authorization header with Bearer token
    [Arguments]        ${token}
    ${headers}=        Create Dictionary    Authorization=Bearer ${token}
    [Return]           ${headers}

Verify Error Response
    [Documentation]    Verify error response has error message
    [Arguments]        ${response}    ${expected_error}
    ${json}=           Set Variable    ${response.json()}
    ${has_error}=      Run Keyword And Return Status    Dictionary Should Contain Key    ${json}    error
    ${has_message}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${json}    message
    Should Be True     ${has_error} or ${has_message}
    ${error_msg}=      Run Keyword If    ${has_error}    Get From Dictionary    ${json}    error
    ...                ELSE    Get From Dictionary    ${json}    message
    Should Contain     ${error_msg}    ${expected_error}    ignore_case=True
