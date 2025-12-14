import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import MyBooks from './pages/MyBooks';
import AddBook from './pages/AddBook';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Profile from './pages/Profile';
import Disputes from './pages/Disputes';
import DisputeDetail from './pages/DisputeDetail';

function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/books/:id" element={<BookDetail />} />

                    {/* Protected Routes */}
                    <Route path="/my-books" element={
                        <PrivateRoute><MyBooks /></PrivateRoute>
                    } />
                    <Route path="/add-book" element={
                        <PrivateRoute><AddBook /></PrivateRoute>
                    } />
                    <Route path="/transactions" element={
                        <PrivateRoute><Transactions /></PrivateRoute>
                    } />
                    <Route path="/transactions/:id" element={
                        <PrivateRoute><TransactionDetail /></PrivateRoute>
                    } />
                    <Route path="/disputes" element={
                        <PrivateRoute><Disputes /></PrivateRoute>
                    } />
                    <Route path="/disputes/:id" element={
                        <PrivateRoute><DisputeDetail /></PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute><Profile /></PrivateRoute>
                    } />
                    <Route path="/user/:id" element={<Profile />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;
