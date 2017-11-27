import Link from 'next/link';
import Head from 'next/head';
import styles from './style';

export default ({ children, title = 'This is the default title' }) => (
    <div>
        <style jsx>{styles}</style>

        <Head>
            <title>{ title }</title>
            <meta charSet='utf-8' />
            <meta name='viewport' content='initial-scale=1.0, width=device-width' />
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" />
        </Head>

        <header>
            <div className="container">
                <div className="row">
                    <div className="col">
                        <h2>Fired Up Admin</h2>
                        
                        <nav>
                            <Link href='/'><a>Home</a></Link> 
                            &nbsp;&bull;&nbsp;
                            <Link href='/admin'><a>Admin</a></Link>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
                
        { children }

        <footer>
            <div className="container">
                <div className="row">
                    <div className="col">
                        Powered By Fired Up
                    </div>
                </div>
            </div>
        </footer>
    </div>
)