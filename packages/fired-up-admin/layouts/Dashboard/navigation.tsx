/**
 * Provides admin navigation
 */
import ImportExportIcon from '@material-ui/icons/ImportExport';
import ListAltIcon from '@material-ui/icons/ListAlt';
import PersonAddIcon from '@material-ui/icons/PersonAdd';

const navigation = [
  {
    title: 'Forms',
    icon: <ListAltIcon />,
    path: '/forms',
  },
  {
    title: 'Create User',
    icon: <PersonAddIcon />,
    path: '/users/create',
  },
  {
    title: 'Importer',
    icon: <ImportExportIcon />,
    path: '/importer',
  },
];

export default navigation;
