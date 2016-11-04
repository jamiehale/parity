// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import BigNumber from 'bignumber.js';
import React, { Component, PropTypes } from 'react';
import { Card, CardTitle, CardText } from 'material-ui/Card';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import LinearProgress from 'material-ui/LinearProgress';

import InputQuery from './inputQuery';
import { subscribeToContractQueries } from '../../../redux/providers/blockchainActions';
import { Container, ContainerTitle, Input } from '../../../ui';

import styles from './queries.css';

class Query extends Component {
  static contextTypes = {
    api: PropTypes.object
  };

  static propTypes = {
    fn: PropTypes.object.isRequired,
    value: PropTypes.any
  };

  shouldComponentUpdate (nextProps) {
    const newFn = nextProps.fn.signature !== this.props.fn.signature;
    const newValue = nextProps.value !== this.props.value;

    return newFn || newValue;
  }

  render () {
    const { fn } = this.props;

    return (
      <div className={ styles.container } key={ fn.signature }>
        <Card className={ styles.method }>
          <CardTitle
            className={ styles.methodTitle }
            title={ fn.name }
          />
          <CardText
            className={ styles.methodContent }
          >
            { this.renderValue() }
          </CardText>
        </Card>
      </div>
    );
  }

  renderValue () {
    const { value } = this.props;

    if (!value) {
      return null;
    }

    const { api } = this.context;
    let valueToDisplay = null;

    if (api.util.isInstanceOf(value, BigNumber)) {
      valueToDisplay = value.toFormat(0);
    } else if (api.util.isArray(value)) {
      valueToDisplay = api.util.bytesToHex(value);
    } else if (typeof value === 'boolean') {
      valueToDisplay = value ? 'true' : 'false';
    } else {
      valueToDisplay = value.toString();
    }

    return (
      <Input
        className={ styles.queryValue }
        value={ valueToDisplay }
        readOnly
        allowCopy
      />
    );
  }
}

class Queries extends Component {
  static contextTypes = {
    api: PropTypes.object
  };

  static propTypes = {
    subscribeToContractQueries: PropTypes.func.isRequired,
    address: PropTypes.string.isRequired,
    contract: PropTypes.object
  };

  componentDidMount () {
    const { address, subscribeToContractQueries } = this.props;
    subscribeToContractQueries(address);
  }

  render () {
    const { contract } = this.props;

    if (!contract || !contract.instance || !contract.queries) {
      return (
        <Container>
          <ContainerTitle title='queries' />
          <LinearProgress mode='indeterminate' />
        </Container>
      );
    }

    const values = contract.queries;

    const queries = contract.instance
      .functions
      .filter((fn) => fn.constant)
      .sort(this._sortEntries);

    const noInputQueries = queries
      .slice()
      .filter((fn) => fn.inputs.length === 0)
      .map((fn) => this.renderQuery(values[fn.name], fn));

    const withInputQueries = queries
      .slice()
      .filter((fn) => fn.inputs.length > 0)
      .map((fn) => this.renderInputQuery(fn));

    return (
      <Container>
        <ContainerTitle title='queries' />
        <div className={ styles.methods }>
          <div className={ styles.vMethods }>
            { noInputQueries }
          </div>
          <div className={ styles.hMethods }>
            { withInputQueries }
          </div>
        </div>
      </Container>
    );
  }

  renderInputQuery (fn) {
    const { abi, name } = fn;
    const { contract } = this.props;

    return (
      <div className={ styles.container } key={ fn.signature }>
        <InputQuery
          className={ styles.method }
          inputs={ abi.inputs }
          outputs={ abi.outputs }
          name={ name }
          contract={ contract.instance }
        />
      </div>
    );
  }

  renderQuery (value, fn) {
    return (
      <Query
        key={ fn.signature }
        value={ value }
        fn={ fn }
      />
    );
  }

  _sortEntries (a, b) {
    return a.name.localeCompare(b.name);
  }
}

function mapStateToProps (state, ownProps) {
  const { contracts } = state.blockchain;
  const contract = contracts[ownProps.address];

  return { contract };
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    subscribeToContractQueries
  }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Queries);

