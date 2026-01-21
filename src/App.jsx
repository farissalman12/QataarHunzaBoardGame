import HourglassGame from './components/HourglassGame'
import ErrorBoundary from './components/UI/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <HourglassGame />
    </ErrorBoundary>
  )
}

export default App
