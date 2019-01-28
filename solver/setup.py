import setuptools

setuptools.setup(
    name='samorozvrh_solver',
    version=1.3,
    description='Schedule optimizer for use in Samorozvrh',
    author='Václav Volhejn',

    packages=setuptools.find_packages(),
    install_requires=[
        'ortools>=6,<7',
    ],
    license='MIT',
    entry_points={
        'console_scripts': [
            'samorozvrh_solver=samorozvrh_solver.main:main',
        ]
    }
)
