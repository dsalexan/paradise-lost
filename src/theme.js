import { createMuiTheme } from '@material-ui/core/styles'
import { red, amber } from '@material-ui/core/colors'

const spacing = 8

// Create a theme instance.
const theme = createMuiTheme({
  spacing,
  palette: {
    type: 'dark',
    primary: {
      main: amber['A700'],
      dark: amber[800],
      light: amber[300],
    },
    secondary: {
      main: '#027BFE',
      dark: '#0054A0',
      light: '#2799FF',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 10,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '*:focus': {
          outline: 'none !important',
        },
      },
    },
    MuiButton: {
      // root: {
      //     borderRadius: `${spacing * 4}px`,
      // },
      // contained: {
      //     padding: `${spacing * 1.5}px`,
      // },
    },
    MuiTooltip: {
      tooltip: {
        fontSize: 12,
      },
    },
    MuiTab: {
      root: {
        textTransform: 'initial',
        fontWeight: 'bold',
        fontSize: '1rem',
      },
      textColorPrimary: {
        // color: 'rgba(0, 0, 0, 0.5)',
      },
    },
    // ACCORDION
    MuiAccordion: {
      root: {
        '&.Mui-expanded': {
          marginBottom: 0,
          marginTop: 0,
        },
      },
    },
    MuiAccordionSummary: {
      root: {
        minHeight: 'auto',
        '&.Mui-expanded': {
          minHeight: 'auto',
        },
      },
      content: {
        '&.Mui-expanded': {
          margin: 0,
        },
      },
    },
    MuiOutlinedInput: {
      inputMarginDense: {
        padding: `${spacing}px ${spacing * 1.5}px`,
        paddingTop: spacing,
        paddingBottom: spacing,
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 992,
      xl: 1200,
    },
  },
})

export default theme
