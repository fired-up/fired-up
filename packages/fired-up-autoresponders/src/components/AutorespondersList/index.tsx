import _map from 'lodash/map';
import format from 'date-fns/format';
import Link from 'next/link';
import React, { SyntheticEvent } from 'react';
import ReactTable from 'react-table';
import { connect } from 'react-redux';

import autoresponders from '../../stores/index';

import '../../styles/_react-table.scss';

type AutorespondersListProps = {
  adminAutoresponders: any;
  deleteAutoresponder: (id: string) => void;
  getAutoresponders: () => void;
};

type AutorespondersListState = {
  autoresponders: [];
};

class AutorespondersList extends React.Component<
  AutorespondersListProps,
  AutorespondersListState
> {
  state: {
    autoresponders: [];
  };

  componentDidMount() {
    this.props.getAutoresponders();
  }

  /**
   * Deletes an autoresponder that corresponds with `id`
   */
  readonly handleDeleteAutoresponder = async (
    e: SyntheticEvent,
    id: string
  ) => {
    e.preventDefault();
    this.props.deleteAutoresponder(id);
  };

  render() {
    const data = _map(
      this.props.adminAutoresponders.autoresponders,
      (autoresponder, id) => {
        return { id, ...autoresponder };
      }
    );

    const columns = [
      {
        Header: 'Name',
        accessor: 'name',
        filterable: true,
        Filter: ({ filter, onChange }) => (
          <input
            onChange={event => onChange(event.target.value)}
            placeholder="Filter"
            style={{ width: '100%' }}
            type="text"
            value={filter && filter.value}
          />
        ),
        filterMethod: (filter, row) => {
          return row.name.toLowerCase().includes(filter.value.toLowerCase());
        },
      },
      {
        Header: 'Subject',
        accessor: 'subject',
      },
      {
        Header: 'Last modified',
        id: 'Modified',
        accessor: row => {
          const timestamp = row.updated_at || row.created_at;
          return timestamp
            ? format(timestamp.toDate(), 'YYYY-MM-DD h:MMa')
            : format(new Date().getTime(), 'YYYY-MM-DD');
        },
      },
      {
        Header: 'Options',
        width: 200,
        Cell: row => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <Link
              as={`/autoresponders/edit/${row.original.id}`}
              href={`/autoresponders/edit?id=${row.original.id}`}
              prefetch
            >
              <a className="btn btn-primary">Edit</a>
            </Link>
            <button
              className="btn btn-danger"
              onClick={e => this.handleDeleteAutoresponder(e, row.original.id)}
            >
              <i className="far fa-trash-alt" style={{ marginRight: 0 }} />
            </button>
          </div>
        ),
      },
    ];

    return (
      <div>
        <ReactTable
          className="-striped -highlight"
          columns={columns}
          data={data}
          defaultPageSize={10}
          defaultSorted={[
            {
              id: 'Modified',
              desc: true,
            },
          ]}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  adminAutoresponders: state.adminAutoresponders,
});

const mapDispatchToProps = dispatch => ({
  getAutoresponders: () => dispatch(autoresponders.getAutoresponders()),
  deleteAutoresponder: (id: string) =>
    dispatch(autoresponders.deleteAutoresponder(id)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AutorespondersList);
