// ==UserScript==
// @name         Grafana Quick Time Selector
// @namespace    http://tampermonkey.net/
// @author       avisaido
// @version      1.0
// @description  Add quick time selection buttons for day and night shifts to Grafana dashboard
// @updateURL    https://raw.githubusercontent.com/Person10802477/grafana/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/Person10802477/grafana/main/script.user.js
// @match        https://grafana-prod.prod.us-east-1.grafana.insights.aft.amazon.dev/d/6VbVrhOMk/myspd-performance-qualification*
// ==/UserScript==

(function() {
    'use strict';

    // Wait for the page to fully load and find the time picker
    function waitForElement(selector, callback, maxAttempts = 20) {
        let attempts = 0;
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (++attempts >= maxAttempts) {
                clearInterval(interval);
                console.log('Grafana Quick Time Selector: Could not find element:', selector);
            }
        }, 500);
    }

    // Function to set time range in Grafana
    function setTimeRange(fromTime, toTime) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('from', fromTime);
        currentUrl.searchParams.set('to', toTime);
        window.location.href = currentUrl.toString();
    }

    // Get date at specific times (in milliseconds) with optional day offset
    function getTimestamp(hour, minute = 0, dayOffset = 0) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        date.setHours(hour, minute, 0, 0);
        return date.getTime();
    }

    // Create button element
    function createButton(label, fromHour, toHour, fromMinute = 0, toMinute = 0, dayOffset = 0) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.cssText = `
            margin: 3px 5px;
            padding: 6px 12px;
            background-color: #3274d9;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            font-weight: 500;
            transition: background-color 0.2s;
        `;

        // Hover effect
        button.onmouseover = () => button.style.backgroundColor = '#5a9aeb';
        button.onmouseout = () => button.style.backgroundColor = '#3274d9';

        // Click handler
        button.onclick = () => {
            const fromTime = getTimestamp(fromHour, fromMinute, dayOffset);
            // If toHour is less than fromHour, it means next day (for night shift)
            let toTime;
            if (toHour < fromHour) {
                toTime = getTimestamp(toHour, toMinute, dayOffset + 1);
            } else {
                toTime = getTimestamp(toHour, toMinute, dayOffset);
            }
            setTimeRange(fromTime, toTime);
        };

        return button;
    }

    // Create the button container
    function createButtonContainer() {
        const container = document.createElement('div');
        container.id = 'quick-time-selector';
        container.style.cssText = `
            padding: 8px 15px;
            background-color: #1f1f1f;
            border-bottom: 1px solid #3a3a3a;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            z-index: 1000;
        `;

        // Add label
        const label = document.createElement('span');
        label.textContent = 'Quick Select: ';
        label.style.cssText = `
            color: #d8d9da;
            margin-right: 10px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        `;
        container.appendChild(label);

        // Add today's shift buttons
        container.appendChild(createButton('Day Shift (07:00-17:30)', 7, 17, 0, 30, 0));
        container.appendChild(createButton('Night Shift (18:00-04:30)', 18, 4, 0, 30, 0));

        // Add yesterday's shift buttons
        container.appendChild(createButton('Day Shift Yesterday', 7, 17, 0, 30, -1));
        container.appendChild(createButton('Night Shift Yesterday', 18, 4, 0, 30, -1));

        return container;
    }

    // Insert the button container into the page
    function insertButtons() {
        // Try multiple possible locations for the button container
        const possibleSelectors = [
            '.navbar',
            '[class*="NavToolbar"]',
            '[class*="page-toolbar"]',
            'nav[class*="navigation"]',
            '.page-header',
            '[data-testid="data-testid Nav toolbar"]'
        ];

        let inserted = false;
        for (const selector of possibleSelectors) {
            waitForElement(selector, (element) => {
                if (!inserted && !document.getElementById('quick-time-selector')) {
                    const container = createButtonContainer();

                    // Insert after the navbar/toolbar
                    element.parentNode.insertBefore(container, element.nextSibling);
                    inserted = true;
                    console.log('Grafana Quick Time Selector: Buttons inserted successfully');
                }
            }, 5);

            if (inserted) break;
        }
    }

    // Run the script after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertButtons);
    } else {
        insertButtons();
    }

    // Also try after a delay in case Grafana loads content dynamically
    setTimeout(insertButtons, 2000);

})();

