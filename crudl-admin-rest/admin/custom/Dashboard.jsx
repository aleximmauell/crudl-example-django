import React from 'react'
import PropTypes from 'prop-types'

class CustomDashboard extends React.Component {
    render() {
        return (
            <div className="mgs-container">
                <div className="mgs-row">
                    <div className="box">
                        <h3>About</h3>
                        <p>
                            This is a <a href="http://crudl.io/" target="_blank">crudl</a> example with <a href="https://www.djangoproject.com/" target="_blank">Django</a> and <a href="http://www.django-rest-framework.org/" target="_blank">DRF</a> (REST), <a href="http://graphene-python.org/" target="_blank">Graphene</a> (GraphQL) and <a href="https://www.sqlite.org/" target="_blank">SQLite</a>.
                        </p>
                        <p>
                            crudl is a backend agnostic React/Redux application in order to rapidly build a beautiful administration interface based on your API (REST or GraphQL).
                        </p>
                        <p>
                            Please note that crudl is still under development and not production ready.
                            A temporary documentation is available on <a href="https://github.com/crudlio/crudl-example-django/blob/master/README.md" target="_blank">GitHub</a>.
                        </p>
                    </div>
                    <div className="box">
                        <h3>Links</h3>
                        <ul>
                            <li><a href="http://crudl.io" target="_blank">crudl.io</a></li>
                            <li><a href="https://twitter.com/crudlio" target="_blank">Twitter</a></li>
                            <li><a href="https://github.com/crudlio" target="_blank">GitHub</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}

export default CustomDashboard
