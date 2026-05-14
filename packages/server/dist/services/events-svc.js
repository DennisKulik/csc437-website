const events = {
    "2026-04-05": {
        id: "2026-04-05",
        week: new Date("2026-04-05"),
        weekdays: [
            {
                day: "Monday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            },
            {
                day: "Tuesday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            },
            {
                day: "Wednesday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            },
            {
                day: "Thursday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            },
            {
                day: "Friday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            },
            {
                day: "Saturday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            },
            {
                day: "Sunday",
                oneTimeEvents: [
                    {
                        title: "Big Bonfire",
                        href: "event.html"
                    }
                ],
                recurringEvents: [
                    {
                        title: "Web Dev Class",
                        href: ""
                    }
                ]
            }
        ]
    }
};
function get(id) {
    return events[id];
}
export default { get };
